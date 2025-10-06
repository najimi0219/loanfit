"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminBankDetailModal from "@/components/AdminBankDetailModal";
import type { HousingLoan } from "@/types/housing-loan"; // インポート




/* ------- Global cosmetic ------- */
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
  background: rgba(var(--card), .66);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  box-shadow: 0 10px 25px -10px rgba(2,6,23,.25);
}
.brand-text{
  background: linear-gradient(90deg,var(--brand-1),var(--brand-2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.pill{
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.7);
  padding: 2px 10px; border-radius:999px; font-size:12px; color:#334155;
}
.dark .pill{ background: rgba(2,6,23,.5); border-color: rgba(255,255,255,.08); color:#cbd5e1; }
.card-hover{ transition: transform .15s ease, box-shadow .2s ease; }
.card-hover:hover{ transform: translateY(-2px); box-shadow: 0 16px 35px -10px rgba(2,6,23,.35); }
.rate-badge{
  font-weight:900; font-size:28px; line-height:1;
  background: linear-gradient(90deg,var(--brand-1),var(--brand-2));
  -webkit-background-clip:text; background-clip:text; color: transparent;
}
.status-variable { background: rgba(34, 197, 94, 0.1); color: rgb(21, 128, 61); }
.status-fixed { background: rgba(59, 130, 246, 0.1); color: rgb(29, 78, 216); }
`;

/*interface HousingLoan {
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
  general_group_insurance_features?: string | null;
  wide_group_insurance: string | null;
  wide_group_insurance_conditions?: string | null;
  cancer_group_insurance_100: string | null;
  cancer_group_insurance_100_notes?: string | null;
  three_major_diseases_plus: string | null;
  three_major_diseases_plus_conditions?: string | null;
  general_insurance_non_participation?: string | null;
  general_insurance_non_participation_notes?: string | null;
  features: string | null;
  created_at: string;
  
  // 雇用形態関連
  employment_regular_months: number | null;
  employment_regular_months_notes?: string | null;
  employment_contract_months: number | null;
  employment_contract_months_notes?: string | null;
  employment_dispatch_months: number | null;
  employment_dispatch_months_notes?: string | null;
  
  // 属性関連
  representative: string | null;
  representative_notes?: string | null;
  self_employed: string | null;
  self_employed_notes?: string | null;
  maternity_paternity_leave: string | null;
  maternity_paternity_leave_notes?: string | null;
  single_person: string | null;
  single_person_notes?: string | null;
  family_residential_loan: string | null;
  no_permanent_residency: string | null;
  permanent_residency_notes?: string | null;
  lgbtq: string | null;
  lgbtq_notes?: string | null;
  pre_marriage_consolidation: string | null;
  common_law_marriage: string | null;
  pair_loan: string | null;
  pair_loan_notes?: string | null;
  income_consolidation_joint_liability: string | null;
  income_consolidation_joint_liability_notes?: string | null;
  income_consolidation_joint_guarantee: string | null;
  income_consolidation_joint_guarantee_notes?: string | null;
  consolidation_employment_type?: string | null;
  consolidation_employment_type_notes?: string | null;
  
  // 物件条件関連
  ms_area_limit_sqm: number | null;
  over_25_years_old: string | null;
  old_earthquake_standards: string | null;
  old_earthquake_standards_notes?: string | null;
  outside_urbanization_area: string | null;
  leasehold: string | null;
  leasehold_notes?: string | null;
  non_rebuildable: string | null;
  non_rebuildable_notes?: string | null;
  existing_non_conforming: string | null;
  existing_non_conforming_notes?: string | null;
  self_management: string | null;
  self_management_notes?: string | null;
  
  // 特殊項目関連
  various_expenses: string | null;
  various_expenses_notes?: string | null;
  renovation: string | null;
  renovation_notes?: string | null;
  property_exchange: string | null;
  property_exchange_notes?: string | null;
  bridge_loan: string | null;
  bridge_loan_notes?: string | null;
  debt_consolidation_loan: string | null;
  debt_consolidation_loan_notes?: string | null;
  
  [key: string]: any;
}*/

export default function AdminPage() {
  const [allLoans, setAllLoans] = useState<HousingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<HousingLoan | null>(null);
  const [sortOrder, setSortOrder] = useState<"rate" | "name">("rate");

  // 全ての住宅ローンデータを取得
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await fetch('/api/housing-loans?limit=100');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        setAllLoans(result.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // ソート処理
  const sortedLoans = [...allLoans].sort((a, b) => {
    if (sortOrder === "rate") {
      const aRate = a.interest_rate || Infinity;
      const bRate = b.interest_rate || Infinity;
      return aRate - bRate;
    } else {
      return (a.bank_name || "").localeCompare(b.bank_name || "");
    }
  });

  // フォーマット関数
  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return `${rate.toFixed(3)}%`;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    const manYen = amount / 10000;
    if (manYen >= 10000) {
      const okuYen = manYen / 10000;
      return `${okuYen.toLocaleString()}億円`;
    }
    return `${manYen.toLocaleString()}万円`;
  };

  return (
    <div className="min-h-screen gradient-hero bg-grid">
      <style>{GLOBAL_CSS}</style>

      {/* ヘッダー */}
      <header className="sticky top-0 z-20 backdrop-blur border-b border-white/30 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              <span className="brand-text">LoanFit</span>
              <span className="ml-2 text-slate-700 dark:text-slate-200 text-base md:text-lg">管理者画面</span>
            </h1>

            {/* ナビゲーションメニュー */}
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50"
              >
                ホームに戻る
              </Link>
            </nav>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            全ての住宅ローン商品を一覧表示しています。
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* ソート切替とカウント */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              住宅ローン一覧
            </h2>
            <div className="text-sm text-slate-500">
              {loading ? "読み込み中..." : `${sortedLoans.length}件`}
            </div>
          </div>

          {/* ソート切替ボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("rate")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                sortOrder === "rate"
                  ? "bg-blue-600 text-white"
                  : "bg-white/50 text-slate-600 hover:bg-white/80"
              }`}
            >
              金利順
            </button>
            <button
              onClick={() => setSortOrder("name")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                sortOrder === "name"
                  ? "bg-blue-600 text-white"
                  : "bg-white/50 text-slate-600 hover:bg-white/80"
              }`}
            >
              銀行名順
            </button>
          </div>
        </div>

        {/* ローディング状態 */}
        {loading && (
          <div className="glass rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-slate-600">住宅ローンデータを読み込んでいます...</p>
          </div>
        )}

        {/* エラー状態 */}
        {error && (
          <div className="glass rounded-xl p-6 border border-red-200 bg-red-50">
            <h3 className="text-red-800 font-medium mb-2">データ取得エラー</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 住宅ローン商品一覧 */}
        {!loading && !error && (
          <div className="space-y-4">
            {sortedLoans.map((loan) => (
              <article
                key={loan.id}
                className="glass rounded-xl p-6 card-hover cursor-pointer"
                onClick={() => setSelectedLoan(loan)}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* 銀行名と基本情報 */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {loan.bank_name}
                    </h3>

                    <div className="flex items-center gap-3 mb-3">
                      {loan.interest_type && (
                        <span className={`pill ${loan.interest_type === '変動' ? 'status-variable' : 'status-fixed'}`}>
                          {loan.interest_type}金利
                        </span>
                      )}
                      {loan.preliminary_screening_method && (
                        <span className="pill">
                          {loan.preliminary_screening_method}審査
                        </span>
                      )}
                    </div>

                    {loan.features && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {loan.features}
                      </p>
                    )}
                  </div>

                  {/* 金利表示 */}
                  <div className="text-center md:text-left">
                    <div className="mb-4">
                      <div className="text-xs text-slate-500 mb-1">適用金利</div>
                      <div className="rate-badge">
                        {formatRate(loan.interest_rate)}
                      </div>
                    </div>
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
                      <span className="text-slate-500">最長期間:</span>
                      <span className="font-medium">
                        {loan.max_loan_period_years ? `${loan.max_loan_period_years}年` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 団信情報 */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">一般団信:</span>
                      <span className={`font-medium ${loan.general_group_insurance === '○' ? 'text-green-600' : 'text-slate-400'}`}>
                        {loan.general_group_insurance || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">ワイド団信:</span>
                      <span className={`font-medium ${loan.wide_group_insurance === '○' ? 'text-green-600' : 'text-slate-400'}`}>
                        {loan.wide_group_insurance || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">がん団信:</span>
                      <span className={`font-medium ${loan.cancer_group_insurance_100 === '○' ? 'text-green-600' : 'text-slate-400'}`}>
                        {loan.cancer_group_insurance_100 || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">三大疾病:</span>
                      <span className={`font-medium ${loan.three_major_diseases_plus === '○' ? 'text-green-600' : 'text-slate-400'}`}>
                        {loan.three_major_diseases_plus || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 銀行詳細モーダル */}
      <AdminBankDetailModal
  loan={selectedLoan}
  onClose={() => setSelectedLoan(null)}
/>
    </div>
  );
}