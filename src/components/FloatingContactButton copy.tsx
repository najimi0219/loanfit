"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

const CONTACT = {
  title: "お問い合わせ",
  orgLabel: "LoanFit運営",
  company: "Vivalapartner株式会社",
  person: "清水",
  tel: "090-7214-2300",
  lineId: "shimizu@vivala",
  lineUrl: "https://works.do/G5BUG7i",
  lineQrSrc: "/line-qr.png", // /public に配置
};

type Pos = { x: number; y: number };

declare global {
  interface Window {
    __loanfitContactMounted?: boolean;
  }
}

export default function FloatingContactButton() {
  // --- シングルトン(重複配置の保険) ---
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__loanfitContactMounted) {
      setHidden(true);
      return;
    }
    window.__loanfitContactMounted = true;
    return () => {
      window.__loanfitContactMounted = false;
    };
  }, []);
  if (hidden) return null;

  // --- UI状態 ---
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  // --- 参照 ---
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const dragged = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  // --- 初期位置(右下)&保存位置の復元 ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // 🔥 ボタンのサイズを考慮した初期位置計算
    const updateInitialPosition = () => {
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const pad = 16;
      
      // ボタンの実際のサイズを取得（まだレンダリングされていない場合は推定値）
      const bw = btnRef.current?.offsetWidth || 280; // デスクトップ想定
      const bh = btnRef.current?.offsetHeight || 50;
      
      const bx = Math.max(pad, iw - bw - pad);
      const by = Math.max(pad, ih - bh - pad);
      setPos({ x: bx, y: by });
    };
    
    updateInitialPosition();
    setReady(true);

    // 🔥 リサイズ時も四隅にスナップ
    const onResize = () => {
      snapToCorner();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- 画面内に収める ---
  function clampToViewport(p: Pos, el?: HTMLElement | null): Pos {
    const pad = 8;
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    const h = typeof window !== "undefined" ? window.innerHeight : 0;
    const bw = el?.offsetWidth ?? 64;
    const bh = el?.offsetHeight ?? 48;
    const x = Math.min(Math.max(p.x, pad), Math.max(w - bw - pad, pad));
    const y = Math.min(Math.max(p.y, pad), Math.max(h - bh - pad, pad));
    return { x, y };
  }

  // --- ドラッグ制御 ---
  const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    dragging.current = true;
    dragged.current = false;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    startOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (!dragging.current) return;
    const nx = e.clientX - startOffset.current.x;
    const ny = e.clientY - startOffset.current.y;
    const next = clampToViewport({ x: nx, y: ny }, btnRef.current);
    if (Math.hypot(next.x - pos.x, next.y - pos.y) > 3) dragged.current = true;
    setPos(next);
  };

  const onPointerUp: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // 🔥 ドラッグ終了時に最寄りの角にスナップ
    if (dragged.current) {
      snapToCorner();
    }
  };

  // 🔥 最も近い角にスナップする関数
  function snapToCorner() {
    if (typeof window === "undefined") return;
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const pad = 16;
    const bw = btnRef.current?.offsetWidth ?? 64;
    const bh = btnRef.current?.offsetHeight ?? 48;

    // 現在のボタン中心位置
    const centerX = pos.x + bw / 2;
    const centerY = pos.y + bh / 2;

    // 4つの角の座標
    const corners = [
      { x: pad, y: pad, name: "左上" },
      { x: iw - bw - pad, y: pad, name: "右上" },
      { x: pad, y: ih - bh - pad, name: "左下" },
      { x: iw - bw - pad, y: ih - bh - pad, name: "右下" },
    ];

    // 最も近い角を見つける
    let nearest = corners[0];
    let minDist = Infinity;

    for (const corner of corners) {
      const cornerCenterX = corner.x + bw / 2;
      const cornerCenterY = corner.y + bh / 2;
      const dist = Math.hypot(centerX - cornerCenterX, centerY - cornerCenterY);
      if (dist < minDist) {
        minDist = dist;
        nearest = corner;
      }
    }

    // スナップアニメーション
    setPos({ x: nearest.x, y: nearest.y });
  }

  const onClick = () => {
    if (dragged.current) {
      dragged.current = false; // ドラッグ直後の誤クリック防止
      return;
    }
    setOpen(true);
  };

  // --- 実寸でモーダル位置を再計算(見切れ防止) ---
  function recomputeModalStyle() {
    if (typeof window === "undefined" || !btnRef.current) return;

    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const pad = 8;
    const gap = 12;

    const btn = btnRef.current.getBoundingClientRect();
    const mw = modalRef.current?.offsetWidth ?? Math.min(iw * 0.92, 360);
    const mh = modalRef.current?.offsetHeight ?? 420;

    let top = btn.bottom + gap;
    if (top + mh > ih - pad) {
      const above = btn.top - mh - gap;
      top = above >= pad ? above : Math.max(pad, ih - mh - pad);
    }

    let left = btn.left;
    if (left + mw > iw - pad) left = iw - mw - pad;
    if (left < pad) left = pad;

    setModalStyle({
      position: "fixed",
      top,
      left,
      maxHeight: "calc(100vh - 16px)",
      overflowY: "auto",
    });
  }

  useLayoutEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(recomputeModalStyle);

    const ro = new ResizeObserver(() => recomputeModalStyle());
    if (modalRef.current) ro.observe(modalRef.current);

    const onScroll = () => recomputeModalStyle();
    window.addEventListener("resize", recomputeModalStyle);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", recomputeModalStyle);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, pos]);

  if (!ready) return null;

  return (
    <>
      {/* ドラッグ可能なフローティングボタン */}
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        className={`fixed z-50 rounded-full shadow-lg bg-[#007FFF] text-white font-medium px-5 py-3 hover:bg-[#0066CC] transition-all duration-200 whitespace-nowrap ${
          dragging.current ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ left: pos.x, top: pos.y }}
        title="お問い合わせを開く(ドラッグで移動)"
      >
        <span className="hidden sm:inline">銀行詳細・不動産相談はこちら</span>
        <span className="sm:hidden">相談する</span>
      </button>

      {/* 背景(クリックで閉じる) */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* モーダル(ボタン付近に出す・見切れ防止) */}
      {open && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className="z-[61] w-[min(92vw,360px)] rounded-2xl bg-white shadow-xl border border-slate-200"
          style={modalStyle}
        >
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold">{CONTACT.title}</h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          <div className="p-5 space-y-4 text-sm text-slate-800">
            <div className="space-y-1">
              <div className="font-medium">{CONTACT.orgLabel}</div>
              <div>運営会社:{CONTACT.company}</div>
              <div>担当者:{CONTACT.person}</div>

              <div className="flex items-center gap-2">
                <span>電話番号:</span>
                <a className="text-indigo-600 underline" href={`tel:${CONTACT.tel}`}>
                  {CONTACT.tel}
                </a>
                <button
                  onClick={() => navigator.clipboard?.writeText(CONTACT.tel)}
                  className="ml-1 text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                >
                  コピー
                </button>
              </div>

              <div className="mt-3">
                <div className="font-medium mb-1">LINE 友だち追加</div>
                <div className="flex items-center gap-2">
                  <span>ID:{CONTACT.lineId}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(CONTACT.lineId)}
                    className="text-xs rounded border px-2 py-0.5 hover:bg-slate-50"
                  >
                    コピー
                  </button>
                </div>
                <div className="break-all">
                  URL:
                  <a className="text-indigo-600 underline" href={CONTACT.lineUrl} target="_blank">
                    {CONTACT.lineUrl}
                  </a>
                </div>

                <div className="mt-3 border rounded-xl p-3 bg-slate-50 flex items-center justify-center">
                  <Image
                    src={CONTACT.lineQrSrc}
                    alt="LINE 友だち追加 QR"
                    width={220}
                    height={220}
                    className="rounded-md max-w-full h-auto"
                    priority
                    onLoadingComplete={() => recomputeModalStyle()}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <a
                href={CONTACT.lineUrl}
                target="_blank"
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                LINE を開く
              </a>
              <a
                href={`tel:${CONTACT.tel}`}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                電話する
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}