// app/loans/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

/* 住宅ローンデータの型定義 */
type HousingLoan = {
  id: string;
  bank_name: string;
  min_annual_income_man_yen: number | null;
  max_loan_amount: number | null;
  interest_type: string | null;
  interest_rate: number | null;
  screening_rate: number | null;
  preliminary_screening_method: string | null;
  max_repayment_age: number | null;
  max_loan_period_years: number | null;
  debt_ratio_0_399: number | null;
  debt_ratio_400_plus: number | null;
  general_group_insurance: string | null;
  wide_group_insurance: string | null;
  cancer_group_insurance_100: string | null;
  three_major_diseases_plus: string | null;
  features: string | null;
  created_at: string;
};

/* グローバルCSS（メインページと同じスタイル） */
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
.glass{
  background: rgba(var(--card), .66);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  box-shadow: 0 10px 25px -10px rgba(2,6,23,.25);
}
.brand-text{
  background: linear-gradient(90deg,var(--brand-1),var(--brand-2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.card-hover{ 
  transition: transform .15s ease, box-shadow .2s ease; 
}
.card-hover:hover{ 
  transform: translateY(-2px); 
  box-shadow: 0 16px 35px -10px rgba(2,6,23,.35); 
}
.rate-display{
  font-weight: 800;
  font-size: 1.5rem;
  background: linear-gradient(90deg,var(--brand-1),var(--brand-2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.status-badge{
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-variable { background: rgba(34, 197, 94, 0.1); color: rgb(21, 128, 61); }
.status-fixed { background: rgba(59, 130, 246, 0.1); color: rgb(29, 78, 216); }
`;

export default function HousingLoansPage() {
  const [loans, setLoans] = useState<HousingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'interest_rate' | 'min_annual_income_man_yen' | 'max_loan_amount' | 'bank_name'>('interest_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 住宅ローンデータを取得
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        order: sortOrder,
        limit: '50'
      });

      const response = await fetch(`/api/housing-loans?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setLoans(result.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || '住宅ローンデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchLoans();
  }, [sortBy, sortOrder]);

  // ソート変更ハンドラ
  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // 数値フォーマット関数
  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return `${(amount / 10000).toLocaleString()}万円`;
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return `${rate.toFixed(3)}%`;
  };

  return (
    <div className="min-h-screen gradient-hero">
      <style>{GLOBAL_CSS}</style>

      {/* ヘッダー */}
      <header className="sticky top-0 z-20 backdrop-blur border-b border-white/30 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              <span className="brand-text">LoanFit</span>
            </Link>
            <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              住宅ローン一覧
            </h1>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {loans.length}件の商品
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* ソート・フィルターバー */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-slate-700 dark:text-slate-200">並び順:</span>
            
            <button 
              onClick={() => handleSort('interest_rate')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'interest_rate' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              金利 {sortBy === 'interest_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button 
              onClick={() => handleSort('min_annual_income_man_yen')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'min_annual_income_man_yen' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              最低年収 {sortBy === 'min_annual_income_man_yen' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button 
              onClick={() => handleSort('max_loan_amount')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'max_loan_amount' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              融資上限 {sortBy === 'max_loan_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button 
              onClick={() => handleSort('bank_name')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'bank_name' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              銀行名 {sortBy === 'bank_name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button 
              onClick={fetchLoans}
              className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>

        {/* ローディング状態 */}
        {loading && (
          <div className="glass rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-slate-600">読み込み中...</p>
          </div>
        )}

        {/* エラー状態 */}
        {error && (
          <div className="glass rounded-xl p-6 border border-red-200 bg-red-50">
            <h3 className="text-red-800 font-medium mb-2">エラーが発生しました</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={fetchLoans}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            >
              再試行
            </button>
          </div>
        )}

        {/* 住宅ローン一覧 */}
        {!loading && !error && (
          <div className="space-y-4">
            {loans.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-slate-600">住宅ローン商品が見つかりませんでした。</p>
              </div>
            ) : (
              loans.map((loan) => (
                <article key={loan.id} className="glass rounded-xl p-6 card-hover">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 基本情報 */}
                    <div className="lg:col-span-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {loan.bank_name}
                      </h2>
                      
                      <div className="flex items-center gap-3 mb-3">
                        {loan.interest_type && (
                          <span className={`status-badge ${
                            loan.interest_type === '変動' ? 'status-variable' : 'status-fixed'
                          }`}>
                            {loan.interest_type}金利
                          </span>
                        )}
                      </div>

                      {loan.features && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {loan.features}
                        </p>
                      )}
                    </div>

                    {/* 金利情報 */}
                    <div className="text-center lg:text-left">
                      <div className="mb-2">
                        <div className="text-xs text-slate-500 mb-1">適用金利</div>
                        <div className="rate-display">
                          {formatRate(loan.interest_rate)}
                        </div>
                      </div>
                      {loan.screening_rate && (
                        <div className="text-xs text-slate-500">
                          審査金利: {formatRate(loan.screening_rate)}
                        </div>
                      )}
                    </div>

                    {/* 条件詳細 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">最低年収:</span>
                        <span className="font-medium">
                          {loan.min_annual_income_man_yen ? `${loan.min_annual_income_man_yen}万円` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">融資上限:</span>
                        <span className="font-medium">
                          {formatCurrency(loan.max_loan_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">完済年齢:</span>
                        <span className="font-medium">
                          {loan.max_repayment_age ? `${loan.max_repayment_age}歳` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">借入期間:</span>
                        <span className="font-medium">
                          {loan.max_loan_period_years ? `${loan.max_loan_period_years}年` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 団信情報 */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">一般団信:</span>
                        <span className="ml-1 font-medium">{loan.general_group_insurance || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">ワイド団信:</span>
                        <span className="ml-1 font-medium">{loan.wide_group_insurance || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">がん団信100:</span>
                        <span className="ml-1 font-medium">{loan.cancer_group_insurance_100 || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">三大疾病:</span>
                        <span className="ml-1 font-medium">{loan.three_major_diseases_plus || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 返済比率 */}
                  {(loan.debt_ratio_0_399 || loan.debt_ratio_400_plus) && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">返済比率:</span>
                        {loan.debt_ratio_0_399 && (
                          <span>年収399万円以下: <strong>{loan.debt_ratio_0_399}%</strong></span>
                        )}
                        {loan.debt_ratio_400_plus && (
                          <span>年収400万円以上: <strong>{loan.debt_ratio_400_plus}%</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* 検索機能へのリンク */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            条件検索に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}