// components/BankDetailModal.tsx
"use client";
import { useEffect } from 'react';

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
    calculationResult?: {
        maxLoanAmount: number;
        monthlyPayment: number;
        applicableDebtRatio: number;
        calculationDetails: {
            annualIncome: number;
            applicableDebtRatio: number;
            maxAnnualPayment: number;
            screeningRate: number;
            loanPeriodYears: number;
        };
    } | null;
};

interface BankDetailModalProps {
    loan: HousingLoan | null;
    onClose: () => void;
}

export default function BankDetailModal({ loan, onClose }: BankDetailModalProps) {
    // ESCキーでモーダルを閉じる
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // モーダルが開いているときはスクロールを無効化
    useEffect(() => {
        if (loan) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [loan]);

    if (!loan) return null;

    const formatRate = (rate: number | null) => {
        if (rate === null) return '-';
        return `${rate.toFixed(3)}%`;
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `${(amount / 10000).toLocaleString()}万円`;
    };

    const formatLoanAmount = (amount: number) => {
        return `${amount.toLocaleString()}万円`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* オーバーレイ */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* モーダルコンテンツ */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* ヘッダー */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {loan.bank_name}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            aria-label="閉じる"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        ※本サービスで表示される銀行候補・金利はあくまで参考情報です。実際の融資可否や条件は各銀行の審査・最新情報に基づきますので、必ずご自身でご確認ください。
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    {/* 基本情報セクション */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-500 rounded"></div>
                            基本情報
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 金利情報 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">金利情報</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">金利タイプ</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${loan.interest_type === '変動'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {loan.interest_type || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">適用金利</span>
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {formatRate(loan.interest_rate)}
                                        </span>
                                    </div>
                                    {/*<div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">審査金利</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {formatRate(loan.screening_rate)}
                                        </span>
                                    </div>*/}
                                </div>
                            </div>

                            {/* 借入条件 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">借入条件</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">最低年収</span>
                                        <span className="font-medium">
                                            {loan.min_annual_income_man_yen ? `${loan.min_annual_income_man_yen}万円` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">融資上限</span>
                                        <span className="font-medium">{formatCurrency(loan.max_loan_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">完済年齢</span>
                                        <span className="font-medium">
                                            {loan.max_repayment_age ? `${loan.max_repayment_age}歳` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">最長期間</span>
                                        <span className="font-medium">
                                            {loan.max_loan_period_years ? `${loan.max_loan_period_years}年` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        {/*<span className="text-slate-600 dark:text-slate-400">事務手数料</span>*/}
                                        <span className="font-medium">
                                            {(loan as any).administrative_fee || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 借入可能額シミュレーション（計算結果がある場合） */}
                    {loan.calculationResult && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-green-500 rounded"></div>
                                借入可能額シミュレーション
                            </h3>

                            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">借入可能額</div>
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                            {formatLoanAmount(loan.calculationResult.maxLoanAmount)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">月々返済額</div>
                                        <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                                            {loan.calculationResult.monthlyPayment.toLocaleString()}円
                                        </div>
                                    </div>
                                    {/*<div className="text-center">
                                        } <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">適用返済比率</div> 
                                        <div className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                                            {loan.calculationResult.applicableDebtRatio}%
                                        </div>
                                    </div>*/}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                        <div>・年収: {loan.calculationResult.calculationDetails.annualIncome}万円</div>
                                        {/*<div>・審査金利: {loan.calculationResult.calculationDetails.screeningRate}%</div>*/}
                                        <div>・借入期間: {loan.calculationResult.calculationDetails.loanPeriodYears}年</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 返済比率 
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-purple-500 rounded"></div>
                            返済比率
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">年収399万円以下</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {loan.debt_ratio_0_399 ? `${loan.debt_ratio_0_399}%` : '-'}
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">年収400万円以上</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {loan.debt_ratio_400_plus ? `${loan.debt_ratio_400_plus}%` : '-'}
                                </div>
                            </div>
                        </div>
                    </section>*/}

                    {/* 団体信用生命保険 */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-red-500 rounded"></div>
                            団体信用生命保険
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: '一般団信', value: loan.general_group_insurance },
                                { label: 'ワイド団信', value: loan.wide_group_insurance },
                                { label: 'がん団信', value: loan.cancer_group_insurance_100 },
                                { label: '三大疾病', value: loan.three_major_diseases_plus }
                            ].map((item, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${item.value === '○'
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        : item.value === '△'
                                            ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                        }`}>
                                        {item.value || '-'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 備考・特徴があれば表示 */}
                        {((loan as any).general_group_insurance_features ||
                            (loan as any).wide_group_insurance_conditions ||
                            (loan as any).cancer_group_insurance_100_notes ||
                            (loan as any).three_major_diseases_plus_conditions) && (
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">条件</h4>
                                    <div className="space-y-3 text-sm">
                                        {(loan as any).general_group_insurance_features && (
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-blue-400">
                                                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">一般団信</div>
                                                <div className="text-slate-700 dark:text-slate-300">{(loan as any).general_group_insurance_features}</div>
                                            </div>
                                        )}
                                        {(loan as any).wide_group_insurance_conditions && (
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-yellow-400">
                                                <div className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">ワイド団信</div>
                                                <div className="text-slate-700 dark:text-slate-300">{(loan as any).wide_group_insurance_conditions}</div>
                                            </div>
                                        )}
                                        {(loan as any).cancer_group_insurance_100_notes && (
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-red-400">
                                                <div className="font-medium text-red-700 dark:text-red-300 mb-1">がん団信100</div>
                                                <div className="text-slate-700 dark:text-slate-300">{(loan as any).cancer_group_insurance_100_notes}</div>
                                            </div>
                                        )}
                                        {(loan as any).three_major_diseases_plus_conditions && ( // ← 🔥 追加
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-purple-400">
                                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">三大疾病</div>
                                                <div className="text-slate-700 dark:text-slate-300">{(loan as any).three_major_diseases_plus_conditions}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                    </section>

                    {/* 詳細条件 */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-yellow-500 rounded"></div>
                            詳細条件
                        </h3>

                        <div className="space-y-6">
                            {/* 雇用形態・勤続期間 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">雇用形態・勤続期間</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: '正社員', months: (loan as any).employment_regular_months, notes: (loan as any).employment_regular_months_notes },
                                        { label: '契約社員', months: (loan as any).employment_contract_months, notes: (loan as any).employment_contract_months_notes },
                                        { label: '派遣社員', months: (loan as any).employment_dispatch_months, notes: (loan as any).employment_dispatch_months_notes }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                {item.months ? `${item.months}ヶ月` : '-'}
                                            </div>
                                            {/*{item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 特殊属性・職業 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">特殊属性・職業</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: '代表', value: (loan as any).representative, notes: (loan as any).representative_notes },
                                        { label: '自営', value: (loan as any).self_employed, notes: (loan as any).self_employed_notes },
                                        { label: '産休育休', value: (loan as any).maternity_paternity_leave, notes: (loan as any).maternity_paternity_leave_notes }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${item.value === '○'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'

                                                : item.value === '△'
                                                    ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                }`}>
                                                {item.value || '-'}
                                            </div>
                                            {/*{item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 借入名義 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">借入名義</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: '単身者', value: (loan as any).single_person, notes: (loan as any).single_person_notes },
                                        { label: 'ペアローン', value: (loan as any).pair_loan, notes: (loan as any).pair_loan_notes },
                                        { label: '収入合算(連帯債務)', value: (loan as any).income_consolidation_joint_liability, notes: (loan as any).income_consolidation_joint_liability_notes },
                                        { label: '収入合算(連帯保証)', value: (loan as any).income_consolidation_joint_guarantee, notes: (loan as any).income_consolidation_joint_guarantee_notes },
                                        { label: '婚姻前合算', value: (loan as any).pre_marriage_consolidation },
                                        { label: '事実婚', value: (loan as any).common_law_marriage }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${item.value === '○'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                : item.value === '△'
                                                    ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                }`}>
                                                {item.value || '-'}
                                            </div>
                                            {/*{item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 特殊な属性・条件 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">特殊な属性・条件</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: '親族居住用融資', value: (loan as any).family_residential_loan },
                                        { label: '永住権なし', value: (loan as any).no_permanent_residency, notes: (loan as any).permanent_residency_notes },
                                        { label: 'LGBTQ', value: (loan as any).lgbtq, notes: (loan as any).lgbtq_notes },
                                        { label: '合算者雇用形態', value: (loan as any).consolidation_employment_type, notes: (loan as any).consolidation_employment_type_notes }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${item.value === '○'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                : item.value === '△'
                                                    ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                }`}>
                                                {item.value || '-'}
                                            </div>
                                            {/*{item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 物件制限 */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">物件制限</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">MS面積制限</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {(loan as any).ms_area_limit_sqm ? `${(loan as any).ms_area_limit_sqm}㎡` : '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    {[
                                        { label: '築25年超', value: (loan as any).over_25_years_old },
                                        { label: '旧耐震', value: (loan as any).old_earthquake_standards, notes: (loan as any).old_earthquake_standards_notes },
                                        { label: '市街化区域外', value: (loan as any).outside_urbanization_area },
                                        { label: '借地権', value: (loan as any).leasehold, notes: (loan as any).leasehold_notes },
                                        { label: '再建築不可', value: (loan as any).non_rebuildable, notes: (loan as any).non_rebuildable_notes },
                                        { label: '既存不適格', value: (loan as any).existing_non_conforming, notes: (loan as any).existing_non_conforming_notes },
                                        { label: '自主管理', value: (loan as any).self_management, notes: (loan as any).self_management_notes }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${item.value === '○'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                : item.value === '△'
                                                    ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                }`}>
                                                {item.value || '-'}
                                            </div>
                                            {/*{item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 融資範囲・その他サービス */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">融資範囲・その他サービス</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: '諸費用', value: (loan as any).various_expenses, notes: (loan as any).various_expenses_notes },
                                        { label: 'リフォーム', value: (loan as any).renovation, notes: (loan as any).renovation_notes },
                                        { label: '買替', value: (loan as any).property_exchange, notes: (loan as any).property_exchange_notes },
                                        { label: 'つなぎ融資', value: (loan as any).bridge_loan, notes: (loan as any).bridge_loan_notes },
                                        { label: 'おまとめローン', value: (loan as any).debt_consolidation_loan, notes: (loan as any).debt_consolidation_loan_notes },
                                        { label: '特殊対応', value: (loan as any).special_handling }
                                    ].map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.label}</div>
                                            <div
                                                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${item.value === '○'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'

                                                    : item.value === '△'
                                                        ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                    }`}
                                            >
                                                {item.value || '-'}
                                            </div>
                                            {/* {item.notes && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</div>
                                            )}*/}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 審査情報 */}
                    {loan.preliminary_screening_method && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-orange-500 rounded"></div>
                                審査情報
                            </h3>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">事前審査方法</div>
                                <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                    {loan.preliminary_screening_method}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 特徴 
                    {loan.features && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-indigo-500 rounded"></div>
                                特徴
                            </h3>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {loan.features}
                                </p>
                            </div>
                        </section>
                    )}*/}
                </div>
            </div>
        </div>
    );
}