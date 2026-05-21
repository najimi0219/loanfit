// loanfit Service Worker
// 方針：HTMLページはネットワーク優先（常に最新を取得）。
//       静的アセット（アイコン等）のみキャッシュ優先。
//       再デプロイのたびに最新が確実に反映される。
const CACHE_NAME = 'loanfit-v2';

// 事前キャッシュするのは静的アセットのみ（HTMLページはキャッシュしない）
const urlsToCache = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// インストール：静的アセットを事前キャッシュし、待機せず即有効化
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// 有効化：旧バージョンのキャッシュを全削除し、すぐに制御を引き継ぐ
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// フェッチ：
//  - ページ遷移（HTML文書）はネットワーク優先。オフライン時のみキャッシュにフォールバック
//  - それ以外（静的アセット等）はキャッシュ優先、なければネットワーク
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // GET 以外には介入しない
  if (request.method !== 'GET') {
    return;
  }

  // ページ遷移は常にネットワーク優先
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match(request);
      })
    );
    return;
  }

  // 静的アセットはキャッシュ優先
  event.respondWith(
    caches.match(request).then(function (response) {
      return response || fetch(request);
    })
  );
});
