'use client';
import { useState } from "react";

export default function PasswordScreen({ 
  onAuthenticated 
}: { 
  onAuthenticated: () => void 
}) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const CORRECT_PASSWORD = "vivala";

  const handleSubmit = () => {
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        onAuthenticated();
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

  return (
    <div className="min-h-screen gradient-hero bg-grid flex items-center justify-center">
      <div className="glass rounded-3xl p-8 max-w-md w-full mx-4">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">
            <span className="brand-text">LoanFit</span>
          </h1>
          <p className="text-slate-600 text-sm">住宅ローン候補検索システム</p>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-4"></div>
        </div>

        {/* パスワード入力 */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              アクセスパスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full px-4 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                error ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'
              }`}
              placeholder="パスワードを入力してください"
              disabled={isLoading}
            />

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !password.trim()}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              isLoading || !password.trim()
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isLoading ? '認証中...' : 'ログイン'}
          </button>
        </div>

        {/* ヒント */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">パスワードヒント</p>
          <p className="text-xs text-blue-600 mt-1">運営会社名</p>
        </div>
      </div>
    </div>
  );
}