import { useState } from "react";

// グローバルCSS
const GLOBAL_CSS = `
:root { --brand-1:#1f6feb; --brand-2:#a371f7; --card:255,255,255; }
.gradient-hero{
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(31,111,235,.25), transparent 60%),
    radial-gradient(1000px 500px at 90% -20%, rgba(163,113,247,.25), transparent 60%),
    linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);
}
.dark .gradient-hero{
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(31,111,235,.25), transparent 60%),
    radial-gradient(1000px 500px at 90% -20%, rgba(163,113,247,.25), transparent 60%),
    linear-gradient(180deg,#0b1220 0%,#0b1220 100%);
}
.bg-grid{
  background-image:
    radial-gradient(transparent 0, transparent 3px, rgba(0,0,0,.04) 3px),
    linear-gradient(120deg, rgba(31,111,235,.08), rgba(163,113,247,.08));
  background-size: 24px 24px, 100% 100%;
}
.glass{
  background: rgba(var(--card), .8);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow: 0 20px 40px -20px rgba(2,6,23,.3);
  border: 1px solid rgba(255,255,255,.2);
}
.brand-text{
  background: linear-gradient(90deg,var(--brand-1),var(--brand-2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.pulse-animation {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.shake-animation {
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
`;

export default function PasswordScreen() {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 正しいパスワード
    const CORRECT_PASSWORD = "loanfit2024";

    const handleSubmit = () => {
        setIsLoading(true);
        setError("");

        // 少し待ってからチェック（リアルっぽく）
        setTimeout(() => {
            if (password === CORRECT_PASSWORD) {
                setIsAuthenticated(true);
                // 実際のアプリでは、ここでlocalStorageに認証フラグを保存するか、
                // 親コンポーネントに認証状態を通知する
            } else {
                setError("パスワードが間違っています");
                setPassword("");
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && password.trim() && !isLoading) {
            handleSubmit();
        }
    };

    // 認証成功後の画面
    if (isAuthenticated) {
        return (
            <div className="min-h-screen gradient-hero bg-grid flex items-center justify-center">
                <style>{GLOBAL_CSS}</style>

                <div className="glass rounded-3xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">認証成功</h2>
                        <p className="text-slate-600">LoanFitへようこそ！</p>
                    </div>

                    <button
                        onClick={() => {
                            // 実際のアプリでは、ページ遷移やルーティングを行う
                            alert("ホーム画面に移動します");
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                    >
                        ホーム画面へ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-hero bg-grid flex items-center justify-center">
            <style>{GLOBAL_CSS}</style>

            <div className="glass rounded-3xl p-8 max-w-md w-full mx-4">
                {/* ロゴ・ヘッダー */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold mb-2">
                        <span className="brand-text">LoanFit</span>
                    </h1>
                    <p className="text-slate-600 text-sm">住宅ローン候補検索システム</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-4"></div>
                </div>

                {/* パスワード入力エリア */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            アクセスパスワード
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className={`w-full px-4 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${error ? 'border-red-300 shake-animation' : 'border-slate-200 focus:border-blue-400'
                                    }`}
                                placeholder="パスワードを入力してください"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        {/* エラーメッセージ */}
                        {error && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ログインボタン */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !password.trim()}
                        className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 transform ${isLoading || !password.trim()
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>認証中...</span>
                            </div>
                        ) : (
                            'ログイン'
                        )}
                    </button>
                </div>

                {/* ヒント */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-blue-700 font-medium">パスワードヒント</p>
                            <p className="text-xs text-blue-600 mt-1">loanfit + 年号4桁</p>
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">
                        © 2024 LoanFit. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

