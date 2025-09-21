// lib/loanCalculator.ts
// 借入可能額計算のユーティリティ関数

export interface LoanCalculationParams {
  annualIncome: number; // 年収（万円）
  screeningRate: number; // 審査金利（%）
  debtRatio0_399: number | null; // 年収399万以下の返済比率（%）
  debtRatio400Plus: number | null; // 年収400万以上の返済比率（%）
  loanPeriodYears: number; // 借入期間（年）
  existingDebtAnnual?: number; // 既存借入の年間返済額（万円）
  requestedYears?: number; // 借入希望年数
  age?: number; // 年齢
  maxRepaymentAge?: number; // 完済年齢上限
  maxLoanPeriodYears?: number; // 最長借入期間
}

export interface LoanCalculationResult {
  maxLoanAmount: number; // 最大借入可能額（万円）
  monthlyPayment: number; // 月々返済額（円）
  applicableDebtRatio: number; // 適用された返済比率（%）
  calculationDetails: {
    annualIncome: number;
    applicableDebtRatio: number;
    maxAnnualPayment: number;
    screeningRate: number;
    loanPeriodYears: number;
  };
}

/**
 * 借入可能額を計算する
 */
export function calculateMaxLoanAmount(params: LoanCalculationParams): LoanCalculationResult | null {
  const {
    annualIncome,
    screeningRate,
    debtRatio0_399,
    debtRatio400Plus,
    existingDebtAnnual = 0,
    requestedYears,
    age,
    maxRepaymentAge,
    maxLoanPeriodYears
  } = params;

  // 入力値の検証
  if (annualIncome <= 0 || screeningRate <= 0) {
    return null;
  }

  // 実際の借入期間を決定するロジック
  let actualLoanPeriodYears = 35; // デフォルト35年

  // 年齢と希望年数の両方がある場合
  if (age && requestedYears && maxRepaymentAge && maxLoanPeriodYears) {
    const maxPossibleYears = maxRepaymentAge - age;
    const availableYears = Math.min(maxLoanPeriodYears, maxPossibleYears);

    if (requestedYears > availableYears) {
      // ①借入希望年数＞借入可能年数→借入可能年数で計算
      actualLoanPeriodYears = availableYears;
    } else {
      // ②借入希望年数＜借入可能年数→借入希望年数で計算
      actualLoanPeriodYears = requestedYears;
    }
  }
  // 希望年数のみある場合（年齢なし）
  else if (requestedYears && requestedYears > 0) {
    actualLoanPeriodYears = requestedYears;
  }
  // 年齢のみある場合（希望年数なし）
  else if (age && maxRepaymentAge && maxLoanPeriodYears) {
    const maxPossibleYears = maxRepaymentAge - age;
    actualLoanPeriodYears = Math.min(maxLoanPeriodYears, maxPossibleYears, 35);
  }
  // ③借入希望額と年齢に記載がない場合は35年で計算
  // (既にデフォルト値35年が設定済み)

  // 借入期間が0以下の場合は計算不可
  if (actualLoanPeriodYears <= 0) {
    return null;
  }

  // 適用する返済比率を決定
  let applicableDebtRatio: number;
  if (annualIncome < 400) {
    applicableDebtRatio = debtRatio0_399 || 30; // デフォルト30%
  } else {
    applicableDebtRatio = debtRatio400Plus || 35; // デフォルト35%
  }

  // 年間返済可能額を計算（既存借入を除く）
  const maxAnnualPayment = (annualIncome * 10000 * applicableDebtRatio / 100) - (existingDebtAnnual * 10000);

  if (maxAnnualPayment <= 0) {
    return null; // 既存借入で返済比率を超えている場合
  }

  // 月間返済可能額
  const maxMonthlyPayment = maxAnnualPayment / 12;

  // 借入可能額を計算（元利均等返済の逆算）
  const monthlyRate = screeningRate / 100 / 12; // 月利
  const totalMonths = actualLoanPeriodYears * 12;

  let maxLoanAmount: number;

  if (monthlyRate === 0) {
    // 金利0%の場合（ありえないが念のため）
    maxLoanAmount = maxMonthlyPayment * totalMonths;
  } else {
    // 元利均等返済の借入元本の計算式
    maxLoanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate);
  }

  return {
    maxLoanAmount: Math.floor(maxLoanAmount / 10000), // 万円単位に変換
    monthlyPayment: Math.floor(maxMonthlyPayment),
    applicableDebtRatio,
    calculationDetails: {
      annualIncome,
      applicableDebtRatio,
      maxAnnualPayment: Math.floor(maxAnnualPayment / 10000), // 万円
      screeningRate,
      loanPeriodYears: actualLoanPeriodYears // 実際に使用された借入期間
    }
  };
}

/**
 * 借入可能額をフォーマット（万円単位で詳細表示）
 */
export function formatLoanAmount(amount: number | null): string {
  if (amount === null || amount <= 0) return '計算不可';

  // 1万円単位で表示
  return `${amount.toLocaleString()}万円`;
}

/**
 * 月々返済額をフォーマット
 */
export function formatMonthlyPayment(amount: number): string {
  return `${amount.toLocaleString()}円`;
}