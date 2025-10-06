"use client";
import { useEffect, useState, useCallback } from "react";
import type { HousingLoan } from "@/types/housing-loan"; // インポート


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
  wide_group_insurance: string | null;
  cancer_group_insurance_100: string | null;
  three_major_diseases_plus: string | null;
  general_insurance_non_participation: string | null;
  features: string | null;
  employment_regular_months: number | null;
  employment_contract_months: number | null;
  employment_dispatch_months: number | null;
  representative: string | null;
  self_employed: string | null;
  maternity_paternity_leave: string | null;
  single_person: string | null;
  family_residential_loan: string | null;
  no_permanent_residency: string | null;
  lgbtq: string | null;
  pre_marriage_consolidation: string | null;
  common_law_marriage: string | null;
  pair_loan: string | null;
  income_consolidation_joint_liability: string | null;
  income_consolidation_joint_guarantee: string | null;
  ms_area_limit_sqm: number | null;
  over_25_years_old: string | null;
  old_earthquake_standards: string | null;
  outside_urbanization_area: string | null;
  leasehold: string | null;
  non_rebuildable: string | null;
  existing_non_conforming: string | null;
  self_management: string | null;
  various_expenses: string | null;
  renovation: string | null;
  property_exchange: string | null;
  bridge_loan: string | null;
  debt_consolidation_loan: string | null;
  wide_group_insurance_conditions?: string | null;
  cancer_group_insurance_100_notes?: string | null;
  three_major_diseases_plus_conditions?: string | null;
  general_group_insurance_features?: string | null;
  general_insurance_non_participation_notes?: string | null;
  [key: string]: any;
}*/

interface Props {
  loan: HousingLoan | null;
  onClose: () => void;
}

export default function AdminBankDetailModal({ loan, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState<HousingLoan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ローンデータが変更されたら編集用のステートを初期化
  useEffect(() => {
    if (loan) {
      setEditedLoan({ ...loan });
    }
  }, [loan]);

  // ESCキーでモーダルを閉じる
// AdminBankDetailModal.tsx の useEffect 部分を修正

// ESCキーのイベントリスナーを修正
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    // 入力フィールドにフォーカスがある場合は何もしない
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }
    
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (loan) {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
  }
  
  return () => {
    document.removeEventListener('keydown', handleEsc);
    document.body.style.overflow = 'unset';
  };
}, [loan, onClose]);

  if (!loan || !editedLoan) return null;

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
  
    console.log('保存開始:', editedLoan?.id);
    console.log('送信データ:', editedLoan);
  
    try {
      if (!editedLoan) {
        throw new Error('編集データがありません');
      }
  
      const url = `/api/housing-loans/${editedLoan.id}`;
      console.log('リクエストURL:', url);
  
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedLoan),
      });
  
      console.log('レスポンスステータス:', response.status);
  
      // レスポンスのテキストを取得
      const responseText = await response.text();
      console.log('レスポンステキスト:', responseText);
  
      if (!response.ok) {
        // JSONとしてパースを試みる
        try {
          const result = JSON.parse(responseText);
          throw new Error(result.error || '保存に失敗しました');
        } catch (e) {
          // JSONパースに失敗した場合は、そのままテキストを使う
          throw new Error(`保存に失敗しました: ${responseText || response.statusText}`);
        }
      }
  
      // 成功時もJSONとしてパース
      const result = JSON.parse(responseText);
      console.log('レスポンスデータ:', result);
  
      setSaveMessage('✓ 保存しました');
      setIsEditing(false);
  
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('保存エラー:', error);
      setSaveMessage(`✗ ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    setEditedLoan({ ...loan });
    setIsEditing(false);
    setSaveMessage(null);
  };

  // フィールド値を更新
  const updateField = (field: string, value: any) => {
    setEditedLoan(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    const manYen = amount / 10000;
    if (manYen >= 10000) {
      const okuYen = manYen / 10000;
      return `${okuYen.toLocaleString()}億円まで`;
    }
    return `${manYen.toLocaleString()}万円まで`;
  };

  const DetailRow = ({ label, value, note, field }: { label: string; value: any; note?: string; field?: string }) => {
    if (!value && value !== 0 && !isEditing) return null;
    
    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded">
          {label}
        </div>
        <div className="col-span-2 text-sm text-slate-900 dark:text-slate-100 px-3 py-2">
          {isEditing && field ? (
            <div>
              <input
                type="text"
                defaultValue={value || ''}
                onBlur={(e) => updateField(field, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
            </div>
          ) : (
            <>
              {value}
              {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
            </>
          )}
        </div>
      </div>
    );
  };
  
  const SymbolRow = ({ label, value, note, field }: { label: string; value: any; note?: string; field?: string }) => {
    const displayValue = value === '○' ? '○' : value === '×' ? '×' : '-';
    const colorClass = value === '○' ? 'text-green-600' : value === '×' ? 'text-red-600' : 'text-slate-400';
    
    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded">
          {label}
        </div>
        <div className="col-span-2 px-3 py-2">
          {isEditing && field ? (
            <div>
              <select
                value={value || ''}
                onChange={(e) => updateField(field, e.target.value)}
                onKeyDown={(e) => {
                  // ESCキーでセレクトを閉じる
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    (e.target as HTMLSelectElement).blur();
                  }
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-</option>
                <option value="○">○</option>
                <option value="×">×</option>
              </select>
              {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
            </div>
          ) : (
            <>
              <span className={`text-lg font-bold ${colorClass}`}>{displayValue}</span>
              {note && <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{note}</div>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* ヘッダー */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{editedLoan.bank_name}</h2>
              <div className="flex items-center gap-3">
                {/* 編集/保存ボタン */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    ✏️ 編集
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '💾 保存'}
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {editedLoan.features && (
              <p className="text-sm text-blue-100 mt-2">{editedLoan.features}</p>
            )}
            {/* 保存メッセージ */}
            {saveMessage && (
              <div className={`mt-2 text-sm font-medium ${saveMessage.includes('✓') ? 'text-green-200' : 'text-red-200'}`}>
                {saveMessage}
              </div>
            )}
          </div>

          {/* コンテンツ */}
          <div className="p-6 space-y-8">
            {/* 1. 基本項目 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-600">
                基本項目
              </h3>
              <div className="space-y-0">
                <DetailRow 
                  label="返済額/月" 
                  value={editedLoan.calculationResult ? `¥${editedLoan.calculationResult.monthlyPayment.toLocaleString()}` : '-'} 
                />
                <DetailRow 
                  label="事務手数料" 
                  value="¥660,000" 
                />
                <DetailRow 
                  label="借入期間" 
                  value="完済年齢内" 
                />
                <DetailRow 
                  label="顧客返済比率" 
                  value={`${editedLoan.debt_ratio_0_399 || '-'}%（年収399万以下）/ ${editedLoan.debt_ratio_400_plus || '-'}%（年収400万以上）`} 
                />
                <DetailRow 
                  label="返比超過" 
                  value="返比内" 
                />
                <DetailRow 
                  label="顧客借入上限" 
                  value={editedLoan.min_annual_income_man_yen || ''}
                  field="min_annual_income_man_yen"
                  note={editedLoan.min_annual_income_man_yen && editedLoan.min_annual_income_man_yen < 400 ? `最低年収${editedLoan.min_annual_income_man_yen}万円` : undefined}
                />
                <DetailRow 
                  label="銀行の融資上限" 
                  value={isEditing ? editedLoan.max_loan_amount || '' : formatCurrency(editedLoan.max_loan_amount)}
                  field="max_loan_amount"
                  note={isEditing ? "単位: 円（例: 300000000 = 3億円）" : undefined}
                />
                <DetailRow 
                  label="変動・固定" 
                  value={editedLoan.interest_type || '-'}
                  field="interest_type"
                />
                <DetailRow 
                  label="金利" 
                  value={editedLoan.interest_rate ? `${editedLoan.interest_rate}%` : '-'}
                  field="interest_rate"
                />
                <DetailRow 
                  label="審査金利" 
                  value={editedLoan.screening_rate ? `${editedLoan.screening_rate}%` : '-'}
                  field="screening_rate"
                />
                <DetailRow 
                  label="事前審査方法" 
                  value={editedLoan.preliminary_screening_method || '-'}
                  field="preliminary_screening_method"
                />
                <DetailRow 
                  label="完済年齢" 
                  value={editedLoan.max_repayment_age ? `${editedLoan.max_repayment_age}歳` : '-'}
                  field="max_repayment_age"
                />
                <DetailRow 
                  label="返済比率 0-399" 
                  value={editedLoan.debt_ratio_0_399 ? `${editedLoan.debt_ratio_0_399}%` : '-'}
                  field="debt_ratio_0_399"
                  note={editedLoan.min_annual_income_man_yen ? `最低年収${editedLoan.min_annual_income_man_yen}万円` : undefined}
                />
                <DetailRow 
                  label="返済比率 400-" 
                  value={editedLoan.debt_ratio_400_plus ? `${editedLoan.debt_ratio_400_plus}%` : '-'}
                  field="debt_ratio_400_plus"
                />
              </div>
            </section>

            {/* 2. 団信 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b-2 border-purple-600">
                団信
              </h3>
              <div className="space-y-0">
                <SymbolRow 
                  label="一般団信" 
                  value={editedLoan.general_group_insurance}
                  field="general_group_insurance"
                  note={editedLoan.general_group_insurance_features || '【一般団信】金利上乗せなし_満18歳以上満65歳未満'}
                />
                <SymbolRow 
                  label="ワイド団信" 
                  value={editedLoan.wide_group_insurance}
                  field="wide_group_insurance"
                  note={editedLoan.wide_group_insurance_conditions || '【ワイド団信】+0.30%_満18歳以上満65歳以下'}
                />
                <SymbolRow 
                  label="がん団信100" 
                  value={editedLoan.cancer_group_insurance_100}
                  field="cancer_group_insurance_100"
                  note={editedLoan.cancer_group_insurance_100_notes}
                />
                <SymbolRow 
                  label="三大疾病以上" 
                  value={editedLoan.three_major_diseases_plus}
                  field="three_major_diseases_plus"
                  note={editedLoan.three_major_diseases_plus_conditions}
                />
                <SymbolRow 
                  label="一般団信不加入利用" 
                  value={editedLoan.general_insurance_non_participation}
                  field="general_insurance_non_participation"
                  note={editedLoan.general_insurance_non_participation_notes}
                />
              </div>
            </section>

            {/* 3. 属性 */}
<section>
  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b-2 border-green-600">
    属性
  </h3>
  <div className="space-y-0">
    <DetailRow 
      label="雇用形態勤続(正社員)" 
      value={editedLoan.employment_regular_months ? `${editedLoan.employment_regular_months}ヶ月` : ''}
      field="employment_regular_months"
      note={editedLoan.employment_regular_months_notes || "直近6ヶ月分の給与明細から算出する。転職後1年未満は職歴書が必要。試用期間は実行不可"}
    />
    <DetailRow 
      label="正社員備考" 
      value={editedLoan.employment_regular_months_notes || ''}
      field="employment_regular_months_notes"
    />
    <DetailRow 
      label="雇用形態勤続(契約)" 
      value={editedLoan.employment_contract_months ? `${editedLoan.employment_contract_months}ヶ月` : ''}
      field="employment_contract_months"
      note={editedLoan.employment_contract_months_notes || "直近3期分の源泉徴収票の提出が必要となる。完済時年齢60歳まで。"}
    />
    <DetailRow 
      label="契約社員備考" 
      value={editedLoan.employment_contract_months_notes || ''}
      field="employment_contract_months_notes"
    />
    <DetailRow 
      label="雇用形態勤続(派遣)" 
      value={editedLoan.employment_dispatch_months ? `${editedLoan.employment_dispatch_months}ヶ月` : ''}
      field="employment_dispatch_months"
      note={editedLoan.employment_dispatch_months_notes || "直近3期分の源泉徴収票の提出が必要となる。完済時年齢60歳まで。"}
    />
    <DetailRow 
      label="派遣社員備考" 
      value={editedLoan.employment_dispatch_months_notes || ''}
      field="employment_dispatch_months_notes"
    />
    <SymbolRow 
      label="代表" 
      value={editedLoan.representative}
      field="representative"
      note={editedLoan.representative_notes || "基本的に物件価格までの借入"}
    />
    <DetailRow 
      label="代表備考" 
      value={editedLoan.representative_notes || ''}
      field="representative_notes"
    />
    <SymbolRow 
      label="自営" 
      value={editedLoan.self_employed}
      field="self_employed"
      note={editedLoan.self_employed_notes || "基本的に物件価格までの借入"}
    />
    <DetailRow 
      label="自営備考" 
      value={editedLoan.self_employed_notes || ''}
      field="self_employed_notes"
    />
    <SymbolRow 
      label="産休育休" 
      value={editedLoan.maternity_paternity_leave}
      field="maternity_paternity_leave"
      note={editedLoan.maternity_paternity_leave_notes}
    />
    <DetailRow 
      label="産休育休備考" 
      value={editedLoan.maternity_paternity_leave_notes || ''}
      field="maternity_paternity_leave_notes"
    />
    <SymbolRow 
      label="単身者" 
      value={editedLoan.single_person}
      field="single_person"
      note={editedLoan.single_person_notes}
    />
    <DetailRow 
      label="単身者備考" 
      value={editedLoan.single_person_notes || ''}
      field="single_person_notes"
    />
    <SymbolRow 
      label="親族居住用融資" 
      value={editedLoan.family_residential_loan}
      field="family_residential_loan"
    />
    <SymbolRow 
      label="永住権なし" 
      value={editedLoan.no_permanent_residency}
      field="no_permanent_residency"
      note={editedLoan.permanent_residency_notes}
    />
    <DetailRow 
      label="永住権なし備考" 
      value={editedLoan.permanent_residency_notes || ''}
      field="permanent_residency_notes"
    />
    <SymbolRow 
      label="LGBTQ" 
      value={editedLoan.lgbtq}
      field="lgbtq"
      note={editedLoan.lgbtq_notes}
    />
    <DetailRow 
      label="LGBTQ備考" 
      value={editedLoan.lgbtq_notes || ''}
      field="lgbtq_notes"
    />
    <SymbolRow 
      label="婚姻前合算" 
      value={editedLoan.pre_marriage_consolidation}
      field="pre_marriage_consolidation"
    />
    <SymbolRow 
      label="事実婚" 
      value={editedLoan.common_law_marriage}
      field="common_law_marriage"
    />
    <SymbolRow 
      label="ペアローン" 
      value={editedLoan.pair_loan}
      field="pair_loan"
      note={editedLoan.pair_loan_notes}
    />
    <DetailRow 
      label="ペアローン備考" 
      value={editedLoan.pair_loan_notes || ''}
      field="pair_loan_notes"
    />
    <SymbolRow 
      label="収入合算(連帯債務)" 
      value={editedLoan.income_consolidation_joint_liability}
      field="income_consolidation_joint_liability"
      note={editedLoan.income_consolidation_joint_liability_notes}
    />
    <DetailRow 
      label="収入合算(連帯債務)備考" 
      value={editedLoan.income_consolidation_joint_liability_notes || ''}
      field="income_consolidation_joint_liability_notes"
    />
    <SymbolRow 
      label="収入合算(連帯保証)" 
      value={editedLoan.income_consolidation_joint_guarantee}
      field="income_consolidation_joint_guarantee"
      note={editedLoan.income_consolidation_joint_guarantee_notes}
    />
    <DetailRow 
      label="収入合算(連帯保証)備考" 
      value={editedLoan.income_consolidation_joint_guarantee_notes || ''}
      field="income_consolidation_joint_guarantee_notes"
    />
    <DetailRow 
      label="合算者雇用形態" 
      value={editedLoan.consolidation_employment_type || ''}
      field="consolidation_employment_type"
      note={editedLoan.consolidation_employment_type_notes}
    />
    <DetailRow 
      label="合算者雇用形態備考" 
      value={editedLoan.consolidation_employment_type_notes || ''}
      field="consolidation_employment_type_notes"
    />
  </div>
</section>

{/* 4. 物件条件 & 特殊項目 */}
<section>
  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b-2 border-orange-600">
    物件条件
  </h3>
  <div className="space-y-0">
    <DetailRow 
      label="MS面積制限" 
      value={editedLoan.ms_area_limit_sqm ? `${editedLoan.ms_area_limit_sqm}㎡` : ''}
      field="ms_area_limit_sqm"
      note="東京カンティで評価できる物件"
    />
    <SymbolRow 
      label="築25年超" 
      value={editedLoan.over_25_years_old}
      field="over_25_years_old"
    />
    <SymbolRow 
      label="旧耐震" 
      value={editedLoan.old_earthquake_standards}
      field="old_earthquake_standards"
      note={editedLoan.old_earthquake_standards_notes}
    />
    <DetailRow 
      label="旧耐震備考" 
      value={editedLoan.old_earthquake_standards_notes || ''}
      field="old_earthquake_standards_notes"
    />
    <SymbolRow 
      label="市街化区域外" 
      value={editedLoan.outside_urbanization_area}
      field="outside_urbanization_area"
    />
    <SymbolRow 
      label="借地権" 
      value={editedLoan.leasehold}
      field="leasehold"
      note={editedLoan.leasehold_notes}
    />
    <DetailRow 
      label="借地権備考" 
      value={editedLoan.leasehold_notes || ''}
      field="leasehold_notes"
    />
    <SymbolRow 
      label="再建築不可" 
      value={editedLoan.non_rebuildable}
      field="non_rebuildable"
      note={editedLoan.non_rebuildable_notes}
    />
    <DetailRow 
      label="再建築不可備考" 
      value={editedLoan.non_rebuildable_notes || ''}
      field="non_rebuildable_notes"
    />
    <SymbolRow 
      label="既存不適格" 
      value={editedLoan.existing_non_conforming}
      field="existing_non_conforming"
      note={editedLoan.existing_non_conforming_notes}
    />
    <DetailRow 
      label="既存不適格備考" 
      value={editedLoan.existing_non_conforming_notes || ''}
      field="existing_non_conforming_notes"
    />
    <SymbolRow 
      label="自主管理" 
      value={editedLoan.self_management}
      field="self_management"
      note={editedLoan.self_management_notes}
    />
    <DetailRow 
      label="自主管理備考" 
      value={editedLoan.self_management_notes || ''}
      field="self_management_notes"
    />
  </div>

  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 pb-2 border-b-2 border-orange-600">
    特殊項目
  </h3>
  <div className="space-y-0">
    <SymbolRow 
      label="諸費用" 
      value={editedLoan.various_expenses}
      field="various_expenses"
      note={editedLoan.various_expenses_notes}
    />
    <DetailRow 
      label="諸費用備考" 
      value={editedLoan.various_expenses_notes || ''}
      field="various_expenses_notes"
    />
    <SymbolRow 
      label="リフォーム" 
      value={editedLoan.renovation}
      field="renovation"
      note={editedLoan.renovation_notes}
    />
    <DetailRow 
      label="リフォーム備考" 
      value={editedLoan.renovation_notes || ''}
      field="renovation_notes"
    />
    <SymbolRow 
      label="買替" 
      value={editedLoan.property_exchange}
      field="property_exchange"
      note={editedLoan.property_exchange_notes}
    />
    <DetailRow 
      label="買替備考" 
      value={editedLoan.property_exchange_notes || ''}
      field="property_exchange_notes"
    />
    <SymbolRow 
      label="つなぎ融資" 
      value={editedLoan.bridge_loan}
      field="bridge_loan"
      note={editedLoan.bridge_loan_notes}
    />
    <DetailRow 
      label="つなぎ融資備考" 
      value={editedLoan.bridge_loan_notes || ''}
      field="bridge_loan_notes"
    />
    <SymbolRow 
      label="おまとめローン" 
      value={editedLoan.debt_consolidation_loan}
      field="debt_consolidation_loan"
      note={editedLoan.debt_consolidation_loan_notes}
    />
    <DetailRow 
      label="おまとめローン備考" 
      value={editedLoan.debt_consolidation_loan_notes || ''}
      field="debt_consolidation_loan_notes"
    />
  </div>
</section>
          </div>

          {/* フッター */}
          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}