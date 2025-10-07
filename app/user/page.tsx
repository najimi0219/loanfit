"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchFormUser";
import { calculateMaxLoanAmount, formatLoanAmount } from "@/lib/loanCalculator";
import type { LoanCalculationParams } from "@/lib/loanCalculator";
import BankDetailModal from "@/components/BankDetailModalUser";
import FloatingContactButton from "@/components/FloatingContactButton";
import SupportedBy from "@/components/SupportedBy";




/* ------- Global cosmetic (前と同じ雰囲気) ------- */
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


/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--brand-1), var(--brand-2));
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #1a5fd6, #9561e8);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--brand-1) rgba(0, 0, 0, 0.05);
}
`;

// 借入可能額計算結果の型定義
interface LoanCalculationResult {
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
}

/* 住宅ローンデータの型定義（計算結果付き） */
interface HousingLoan {
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

    // 🔥 追加：計算結果のプロパティを型定義に含める
    calculationResult?: LoanCalculationResult | null;
    combinedCalculationResult?: LoanCalculationResult | null;
    combinedEmploymentWarning?: string;
    conEmploymentWarning?: string;
    incomeWarning?: string; // 最低年収警告を追加
    // 実際のAPIデータに存在するかもしれない借入名義関連フィールド
    [key: string]: any; // 任意のプロパティを許可
}

// 全角→半角, カンマ/空白除去, 数字抽出
function toNumberLike(v: any): number {
    if (typeof v === 'number') return v;
    const s = String(v ?? "").replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
    const n = s.replace(/[,，\s]/g, "");
    if (!/^\d+(\.\d+)?$/.test(n)) return NaN;
    return Number(n);
}

// JSONのキーが日本語スラッグでも英語でも拾えるように候補で探す
function pick(values: Record<string, any>, candidates: string[]): any {
    for (const key of candidates) {
        if (values[key] !== undefined && values[key] !== "" && values[key] !== null) {
            return values[key];
        }
    }
    return undefined;
}

// 勤続期間を月数に変換する関数
function convertTenureToMonths(tenure: string): number {
    const tenureMap: Record<string, number> = {
        "１ヵ月": 1,
        "３ヵ月": 3,
        "半年": 6,
        "1年": 12,
        "2年": 24,
        "3年以上": 36
    };

    return tenureMap[tenure] || 0;
}

// 雇用形態の取り扱い可否をチェックする関数
function checkEmploymentSupport(loan: HousingLoan, employmentType: string): boolean {
    let fieldValue: any = null;

    // 実際のフィールド名に基づいて取得
    const employmentFieldMap: Record<string, string> = {
        "正社員": "employment_regular_months",
        "契約": "employment_contract_months",
        "派遣": "employment_dispatch_months"
    };

    const fieldName = employmentFieldMap[employmentType];
    if (fieldName) {
        fieldValue = loan[fieldName];
    }

    // nullの場合は取り扱い不可
    if (fieldValue === null || fieldValue === undefined) {
        return false;
    }

    // 数字（number）の場合は取り扱い可
    if (typeof fieldValue === "number" && !isNaN(fieldValue)) {
        return true;
    }

    // 文字列で数字の場合も取り扱い可
    if (typeof fieldValue === "string" && !isNaN(Number(fieldValue)) && fieldValue.trim() !== "") {
        return true;
    }

    // その他の場合は取り扱い不可
    return false;
}

// 勤続期間の条件をチェックする関数
function checkTenureRequirement(loan: HousingLoan, employmentType: string, userTenureMonths: number): boolean {
    const employmentFieldMap: Record<string, string> = {
        "正社員": "employment_regular_months",
        "契約": "employment_contract_months",
        "派遣": "employment_dispatch_months"
    };

    const fieldName = employmentFieldMap[employmentType];
    if (!fieldName) return true; // 対応していない雇用形態の場合は通す

    const requiredMonths = loan[fieldName];

    // 銀行の必要勤続月数がnullまたは未定義の場合は取り扱い不可
    if (requiredMonths === null || requiredMonths === undefined) {
        return false;
    }

    // 数字の場合、ユーザーの勤続月数が銀行の必要月数以上かチェック
    const requiredMonthsNum = typeof requiredMonths === "number" ? requiredMonths : Number(requiredMonths);

    if (!isNaN(requiredMonthsNum)) {
        return userTenureMonths >= requiredMonthsNum;
    }

    return false;
}

function checkCombinedEmploymentSupport(loan: HousingLoan, employmentType: string): boolean {
    let fieldValue: any = null;

    // 実際のフィールド名に基づいて取得
    const employmentFieldMap: Record<string, string> = {
        "正社員": "employment_regular_months",
        "契約": "employment_contract_months",
        "派遣": "employment_dispatch_months"
    };

    const fieldName = employmentFieldMap[employmentType];
    if (fieldName) {
        fieldValue = loan[fieldName];
    }

    // nullの場合は取り扱い不可
    if (fieldValue === null || fieldValue === undefined) {
        return false;
    }

    // 数字（number）の場合は取り扱い可
    if (typeof fieldValue === "number" && !isNaN(fieldValue)) {
        return true;
    }

    // 文字列で数字の場合も取り扱い可
    if (typeof fieldValue === "string" && !isNaN(Number(fieldValue)) && fieldValue.trim() !== "") {
        return true;
    }

    return false;
}

// 合算者の勤続期間の条件をチェックする関数
function checkCombinedTenureRequirement(loan: HousingLoan, employmentType: string, userTenureMonths: number): boolean {
    const employmentFieldMap: Record<string, string> = {
        "正社員": "employment_regular_months",
        "契約": "employment_contract_months",
        "派遣": "employment_dispatch_months"
    };

    const fieldName = employmentFieldMap[employmentType];
    if (!fieldName) return true; // 対応していない雇用形態の場合は通す

    const requiredMonths = loan[fieldName];

    // 銀行の必要勤続月数がnullまたは未定義の場合は取り扱い不可
    if (requiredMonths === null || requiredMonths === undefined) {
        return false;
    }

    // 数字の場合、ユーザーの勤続月数が銀行の必要月数以上かチェック
    const requiredMonthsNum = typeof requiredMonths === "number" ? requiredMonths : Number(requiredMonths);

    if (!isNaN(requiredMonthsNum)) {
        return userTenureMonths >= requiredMonthsNum;
    }

    return false;
}
// フィルタリング関数
// 修正版のfilterLoans関数
// 修正版のfilterLoans関数
function filterLoans(loans: HousingLoan[], filters: Record<string, any>): HousingLoan[] {
    return loans.map(loan => {
        // 各種警告メッセージを格納
        let combinedEmploymentWarning = "";
        let conEmploymentWarning = "";
        let incomeWarning = ""; // 最低年収警告を追加


        // 主債務者の雇用形態チェック（従来通り - 条件不適合は除外）
        const employmentType = pick(filters, ["雇用形態"]);
        if (employmentType) {
            // パート・アルバイトの場合は全銀行表示されない
            if (employmentType === "パート" || employmentType === "アルバイト") {
                return null; // 除外対象
            }

            // 銀行の雇用形態勤続フィールドをチェック
            if (!checkEmploymentSupport(loan, employmentType)) {
                return null; // 除外対象
            }

            // 勤続期間のチェック
            const tenure = pick(filters, ["勤続"]);
            if (tenure && tenure !== "選択してください") {
                const userTenureMonths = convertTenureToMonths(tenure);
                if (userTenureMonths > 0) {
                    if (!checkTenureRequirement(loan, employmentType, userTenureMonths)) {
                        return null; // 除外対象
                    }
                }
            }
        }

        // 🔥 新規追加：合算者の雇用形態チェック（警告のみ、除外はしない）

        const combinedEmploymentType = pick(filters, ["雇用形態（合算者）"]);
        const loanOwnership = pick(filters, ["借入名義"]);

        // 🔥 修正：婚姻前チェックボックスが ON または 借入名義が婚姻前合算の場合のチェック

        const isPreMarriageFilter = pick(filters, ["婚姻前"]); // チェックボックス

        // 婚姻前フィルターがONの場合は、対応していない銀行を除外
        if (isPreMarriageFilter) {
            const supportsPreMarriage = loan["pre_marriage_consolidation"];
            if (!supportsPreMarriage || supportsPreMarriage !== "○") {
                conEmploymentWarning = "婚姻前の融資は未対応の可能性があります。合算者は融資条件を満たしません（婚姻前合算未対応）";
            }
        }

        // 借入名義が婚姻前合算の場合の警告（除外はしない）



        // 合算者の持病の有無チェック（婚姻前合算で既に警告がある場合はスキップ）
        if (!combinedEmploymentWarning) {
            const combinedJibyou = pick(filters, ["持病の有無（合算者）"]);
            if (combinedJibyou) {
                const supportsWideDanshin = loan["wide_group_insurance"] === "○";
                const supportsMudanshin = loan["general_insurance_non_participation"] === "○";

                // ワイド団信または無団信のいずれかが○である必要
                if (!supportsWideDanshin && !supportsMudanshin) {
                    combinedEmploymentWarning = "合算者は融資条件を満たしません（持病対応団信なし）";
                }
            }
        }

        // 合算者の団信チェック（主債務者と同じロジック、警告のみ）
        const combinedDanshin = pick(filters, ["団信（合算者）"]);
        if (combinedDanshin && !combinedEmploymentWarning) {
            let combinedDanshinSupported = false;

            switch (combinedDanshin) {
                case "一般団信":
                    combinedDanshinSupported = loan["general_group_insurance"] === "○";
                    break;
                case "がん100":
                    combinedDanshinSupported = loan["cancer_group_insurance_100"] === "○";
                    break;
                case "3大疾病":
                    combinedDanshinSupported = loan["three_major_diseases_plus"] === "○";
                    break;
                case "無団信":
                    combinedDanshinSupported = loan["general_insurance_non_participation"] === "○";
                    break;
                case "ワイド団信":
                    combinedDanshinSupported = loan["wide_group_insurance"] === "○";
                    break;
                default:
                    combinedDanshinSupported = true; // 未知の選択肢の場合は通す
                    break;
            }

            // 対応していない場合は警告を表示し、後で借入可能額を0円にする
            if (!combinedDanshinSupported) {
                combinedEmploymentWarning = `合算者は融資条件を満たしません（${combinedDanshin}非対応）`;
            }
        }
        // 雇用形態チェック（上記チェックで既に警告がある場合はスキップ）
        if (!conEmploymentWarning && !combinedEmploymentWarning && combinedEmploymentType && combinedEmploymentType !== "選択してください") {
            // 既存の雇用形態チェックロジック...
        }
        // 雇用形態チェック（上記チェックで既に無効でない場合のみ）
        // 🔥 新規追加：合算者の持病の有無チェック
        if (!combinedEmploymentWarning) {
            const combinedJibyou = pick(filters, ["持病の有無（合算者）"]);
            if (combinedJibyou) {
                const supportsWideDanshin = loan["wide_group_insurance"] === "○";
                const supportsMudanshin = loan["general_insurance_non_participation"] === "○";

                // ワイド団信または無団信のいずれかが○である必要
                if (!supportsWideDanshin && !supportsMudanshin) {
                    combinedEmploymentWarning = "合算者は融資条件を満たしません（持病対応団信なし）";
                }
            }
        }

        // 雇用形態チェック（上記チェックで既に警告がある場合はスキップ）
        if (!combinedEmploymentWarning && combinedEmploymentType && combinedEmploymentType !== "選択してください") {
            if (combinedEmploymentType === "パート" || combinedEmploymentType === "アルバイト") {
                combinedEmploymentWarning = "合算者は融資条件を満たしません（雇用形態：パート・アルバイト不可）";
            } else {
                // 銀行の雇用形態勤続フィールドをチェック
                if (!checkEmploymentSupport(loan, combinedEmploymentType)) {
                    combinedEmploymentWarning = "合算者は融資条件を満たしません（雇用形態取り扱い不可）";
                } else {
                    // 勤続期間のチェック
                    const combinedTenure = pick(filters, ["勤続_合算者"]);
                    if (combinedTenure && combinedTenure !== "選択してください") {
                        const combinedTenureMonths = convertTenureToMonths(combinedTenure);
                        if (combinedTenureMonths > 0) {
                            if (!checkTenureRequirement(loan, combinedEmploymentType, combinedTenureMonths)) {
                                combinedEmploymentWarning = "合算者は融資条件を満たしません（勤続期間不足）";
                            }
                        }
                    }
                }
            }
        }

        // 以下、従来のフィルタリング条件をチェック（変更なし）

        // チェックボックス項目のフィルタリング
        // 代表者チェック
        const daihyo = pick(filters, ["代表"]);
        if (daihyo) {
            const supportsDaihyo = loan["representative"];
            if (!supportsDaihyo || supportsDaihyo !== "○") {
                return null; // 除外対象
            }
        }

        // 自営業チェック
        const jieigyou = pick(filters, ["自営"]);
        if (jieigyou) {
            const supportsJieigyou = loan["self_employed"];
            if (!supportsJieigyou || supportsJieigyou !== "○") {
                return null; // 除外対象
            }
        }

        // 産休育休チェック
        const sankyuuikukyu = pick(filters, ["産休育休"]);
        if (sankyuuikukyu) {
            const supportsSankyuuikukyu = loan["maternity_paternity_leave"];
            if (!supportsSankyuuikukyu || supportsSankyuuikukyu !== "○") {
                return null; // 除外対象
            }
        }

        // 親族居住用融資チェック
        const shinzokukyojuu = pick(filters, ["親族居住用融資"]);
        if (shinzokukyojuu) {
            const supportsShinzokukyojuu = loan["family_residential_loan"];
            if (!supportsShinzokukyojuu || supportsShinzokukyojuu !== "○") {
                return null; // 除外対象
            }
        }

        // 永住権なしチェック
        const eijuuken = pick(filters, ["永住権なし"]);
        if (eijuuken) {
            const supportsEijuuken = loan["no_permanent_residency"];
            if (!supportsEijuuken || supportsEijuuken !== "○") {
                return null; // 除外対象
            }
        }

        // LGBTQチェック
        const lgbtq = pick(filters, ["lgbtq"]);
        if (lgbtq) {
            const supportsLgbtq = loan["lgbtq"];
            if (!supportsLgbtq || supportsLgbtq !== "○") {
                return null; // 除外対象
            }
        }

        // 事実婚チェック
        const jijitsukon = pick(filters, ["事実婚"]);
        if (jijitsukon) {
            const supportsJijitsukon = loan["common_law_marriage"];
            if (!supportsJijitsukon || supportsJijitsukon !== "○") {
                return null; // 除外対象
            }
        }

        // 諸費用込ローンチェック
        const shohiyou_roan = pick(filters, ["諸費用込ローン"]);
        if (shohiyou_roan) {
            const supportsShohiyou = loan["various_expenses"];
            if (!supportsShohiyou || supportsShohiyou !== "○") {
                return null; // 除外対象
            }
        }

        // リフォームチェック
        const reform = pick(filters, ["リフォーム"]);
        if (reform) {
            const supportsReform = loan["renovation"];
            if (!supportsReform || supportsReform !== "○") {
                return null; // 除外対象
            }
        }

        // 買替チェック
        const kaigae = pick(filters, ["買替（買い先行）"]);
        if (kaigae) {
            const supportsKaigae = loan["property_exchange"];
            if (!supportsKaigae || supportsKaigae !== "○") {
                return null; // 除外対象
            }
        }

        // つなぎ融資チェック
        const tsunagi = pick(filters, ["つなぎ融資"]);
        if (tsunagi) {
            const supportsTsunagi = loan["bridge_loan"];
            if (!supportsTsunagi || supportsTsunagi !== "○") {
                return null; // 除外対象
            }
        }

        // おまとめローンチェック
        const omatome = pick(filters, ["おまとめローン"]);
        if (omatome) {
            const supportsOmatome = loan["debt_consolidation_loan"];
            if (!supportsOmatome || supportsOmatome !== "○") {
                return null; // 除外対象
            }
        }

        // 再建築不可チェック
        const saikenchiku_fuka = pick(filters, ["再建築不可"]);
        if (saikenchiku_fuka) {
            const supportsSaikenchiku = loan["non_rebuildable"];
            if (!supportsSaikenchiku || supportsSaikenchiku !== "○") {
                return null; // 除外対象
            }
        }

        // 借地権チェック
        const shakuchi = pick(filters, ["借地権"]);
        if (shakuchi) {
            const supportsShakuchi = loan["leasehold"];
            if (!supportsShakuchi || supportsShakuchi !== "○") {
                return null; // 除外対象
            }
        }

        // 既存不適格チェック
        const kizon_futekikaku = pick(filters, ["既存不適格"]);
        if (kizon_futekikaku) {
            const supportsKizonFutekikaku = loan["existing_non_conforming"];
            if (!supportsKizonFutekikaku || supportsKizonFutekikaku !== "○") {
                return null; // 除外対象
            }
        }

        // 自主管理チェック
        const jishu_kanri = pick(filters, ["自主管理"]);
        if (jishu_kanri) {
            const supportsJishuKanri = loan["self_management"];
            if (!supportsJishuKanri || supportsJishuKanri !== "○") {
                return null; // 除外対象
            }
        }
        // 専有面積チェック（ms_area_limit_sqm フィールドと比較）
        const senyu_menseki = pick(filters, ["専有面積"]);
        if (senyu_menseki && !isNaN(toNumberLike(senyu_menseki))) {
            const userArea = toNumberLike(senyu_menseki);
            const bankAreaLimit = loan["ms_area_limit_sqm"];

            // 銀行の面積制限が設定されており、ユーザーの専有面積が制限を下回る場合は除外
            if (bankAreaLimit && typeof bankAreaLimit === "number" && userArea < bankAreaLimit) {
                return null; // 除外対象
            }
        }
        // 築年数フィルター（シンプル版）
        const chiku_nen = pick(filters, ["築年（年）ex 1998"]);
        console.log("築年数フィルター - 入力値:", chiku_nen);

        if (chiku_nen && !isNaN(toNumberLike(chiku_nen))) {
            const inputYear = toNumberLike(chiku_nen);
            const currentYear = new Date().getFullYear();
            const year25Ago = currentYear - 25;
            const newEarthquakeStandardYear = 1981;

            // ユーザー入力の築年による条件チェック
            const isOver25Years = inputYear < year25Ago; // 25年超の物件かどうか
            const isOldEarthquakeStandard = inputYear < newEarthquakeStandardYear; // 旧耐震かどうか

            // 銀行の対応状況を取得
            const supportsOver25Years = loan["over_25_years_old"]; // 築25年超対応
            const supportsOldEarthquake = loan["old_earthquake_standards"]; // 旧耐震対応

            console.log("築年数フィルター - 詳細:", {
                bankName: loan.bank_name,
                inputYear,
                isOver25Years,
                isOldEarthquakeStandard,
                supportsOver25Years,
                supportsOldEarthquake
            });

            // シンプルなロジック：該当する条件で銀行が×の場合は除外

            // ①25年超の物件で、銀行が25年超に対応していない場合は除外
            if (isOver25Years && supportsOver25Years === "×") {
                console.log("築年数フィルター - 除外理由: 25年超物件で銀行が非対応");
                return null; // 除外対象
            }

            // ②旧耐震の物件で、銀行が旧耐震に対応していない場合は除外
            if (isOldEarthquakeStandard && supportsOldEarthquake === "×") {
                console.log("築年数フィルター - 除外理由: 旧耐震物件で銀行が非対応");
                return null; // 除外対象
            }

            console.log("築年数フィルター - 結果: 表示");
        }


        const danshin = pick(filters, ["団信"]);
        if (danshin) {
            let danshinSupported = false;

            switch (danshin) {
                case "一般団信":
                    danshinSupported = loan["general_group_insurance"] === "○";
                    break;
                case "がん100":
                    danshinSupported = loan["cancer_group_insurance_100"] === "○";
                    break;
                case "3大疾病":
                    danshinSupported = loan["three_major_diseases_plus"] === "○";
                    break;
                case "無団信":
                    danshinSupported = loan["general_insurance_non_participation"] === "○";
                    break;
                case "ワイド団信":
                    danshinSupported = loan["wide_group_insurance"] === "○";
                    break;
                default:
                    danshinSupported = true; // 未知の選択肢の場合は通す
                    break;
            }

            if (!danshinSupported) {
                return null; // 除外対象
            }
        }

        // 持病の有無チェック（ワイド団信または無団信が必要）
        const jibyou = pick(filters, ["持病の有無"]);
        if (jibyou) {
            const supportsWideDanshin = loan["wide_group_insurance"] === "○";
            const supportsMudanshin = loan["general_insurance_non_participation"] === "○";

            // ワイド団信または無団信のいずれかが○である必要
            if (!supportsWideDanshin && !supportsMudanshin) {
                return null; // 除外対象
            }
        }

        // 年収条件チェック
        const requiredIncome = pick(filters, ["年収（万円）", "年収_万円", "incomeSelf"]);
        if (requiredIncome) {
            const income = toNumberLike(requiredIncome);
            if (!isNaN(income) && loan.min_annual_income_man_yen && income < loan.min_annual_income_man_yen) {
                return null; // 除外対象
            }
        }

        // 借入希望額チェック
        const loanAmount = pick(filters, ["借入希望額（万円）", "借入希望額_万円", "物件価格（万円）", "物件価格_万円"]);
        if (loanAmount) {
            const amount = toNumberLike(loanAmount) * 10000; // 万円を円に変換
            if (!isNaN(amount) && loan.max_loan_amount && amount > loan.max_loan_amount) {
                return null; // 除外対象
            }
        }

        // 変動・固定金利タイプ
        const interestType = pick(filters, ["変動・固定", "金利タイプ"]);
        if (interestType && loan.interest_type) {
            if (!loan.interest_type.includes(interestType)) {
                return null; // 除外対象
            }
        }

        // 借入名義チェック
        if (loanOwnership) {
            // 「単独名義（所帯有）」の場合はフィルタリングしない（全ての銀行を表示）
            if (loanOwnership === "単独名義（所帯有）") {
                // このチェックをスキップして次の条件に進む
            } else {
                // 借入名義と銀行データのマッピング
                const ownershipMapping: Record<string, string> = {
                    "単身者": "single_person",
                    "ペアローン": "pair_loan",
                    "収入合算(連帯債務)": "income_consolidation_joint_liability",
                    "収入合算(連帯保証)": "income_consolidation_joint_guarantee",
                    "婚姻前合算": "pre_marriage_consolidation"
                };

                const mappedField = ownershipMapping[loanOwnership];

                if (mappedField) {
                    const fieldValue = loan[mappedField];

                    // フィールドが"○"でない場合は除外
                    if (!fieldValue || String(fieldValue).trim() !== "○") {
                        return null; // 除外対象
                    }
                } else {
                    return null; // 除外対象
                }
            }
        }

        if (requiredIncome) {
            const income = toNumberLike(requiredIncome);
            if (!isNaN(income) && loan.min_annual_income_man_yen && income < loan.min_annual_income_man_yen) {
                incomeWarning = `主債務者は融資条件を満たしません（最低年収${loan.min_annual_income_man_yen}万円以上）`;
            }
        }

        // 合算者の年収チェック（ペアローンの場合のみ）
        const combinedIncome = pick(filters, ["年収_合算者", "年収（合算者）"]);

        // ペアローンの場合、合算者も最低年収をチェック
        if (loanOwnership === "ペアローン" && combinedIncome && !incomeWarning) {
            const combinedIncomeVal = toNumberLike(combinedIncome);
            if (!isNaN(combinedIncomeVal) && loan.min_annual_income_man_yen && combinedIncomeVal < loan.min_annual_income_man_yen) {
                incomeWarning = `合算者は融資条件を満たしません（最低年収${loan.min_annual_income_man_yen}万円以上）`;
            }
        }

        // 年齢制限チェック
        const age = pick(filters, ["年齢"]);
        if (age) {
            const ageNum = toNumberLike(age);
            if (!isNaN(ageNum) && loan.max_repayment_age) {
                // 現在の年齢が完済年齢を超えている場合のみ除外
                if (ageNum >= loan.max_repayment_age) {
                    return null; // 除外対象
                }

                // 借入期間が指定されている場合は、完済時年齢をチェック
                const years = pick(filters, ["借入期間（年）", "借入期間_年"]);
                if (years) {
                    const yearsNum = toNumberLike(years);
                    if (!isNaN(yearsNum)) {
                        const finalAge = ageNum + yearsNum;
                        if (finalAge > loan.max_repayment_age) {
                            return null; // 除外対象
                        }
                    }
                }
            }
        }

        // 🔥 すべての条件をクリアした場合、警告情報付きでloanを返す
        return {
            ...loan,
            combinedEmploymentWarning,
            conEmploymentWarning,
            incomeWarning // 最低年収警告を追加

        };
    }).filter(loan => loan !== null); // nullの項目（除外対象）をフィルタリング
}





function PasswordScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
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
                            className={`w-full px-4 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${error ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'
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
                        className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 ${isLoading || !password.trim()
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
export default function Home() {
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [allLoans, setAllLoans] = useState<HousingLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<HousingLoan | null>(null);
    const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
    useEffect(() => {
        console.log('✅ selectedBankId changed to:', selectedBankId);
    }, [selectedBankId]);
    const [clearTrigger, setClearTrigger] = useState(0); // 追加
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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


    // 🔥 新規追加: スクロール監視用のuseEffect
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // PC（lg以上）では常に表示
            if (window.innerWidth >= 1024) {
                setIsHeaderVisible(true);
                return;
            }

            // モバイルでのみ自動非表示機能を有効化
            if (currentScrollY < 10) {
                setIsHeaderVisible(true);
            }
            else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsHeaderVisible(false);
            }
            else if (currentScrollY < lastScrollY) {
                setIsHeaderVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        const handleResize = () => {
            // 画面サイズ変更時にPC判定をリセット
            if (window.innerWidth >= 1024) {
                setIsHeaderVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [lastScrollY]);

    // フィルタリングされた住宅ローン一覧（借入可能額計算付き）
    // フィルタリングされた住宅ローン一覧（借入可能額計算付き）
    // page.tsx の型安全版（完全修正）

    const filteredLoansWithCalculation = useMemo(() => {
        if (!allLoans.length) return [];

        // 年収が入力されている場合、借入可能額を計算
        const annualIncome = pick(filters, ["年収（万円）", "年収_万円", "incomeSelf"]);
        const combinedAnnualIncome = pick(filters, ["年収_合算者", "年収（合算者）"]);
        const loanPeriodYears = pick(filters, ["借入期間（年）", "借入期間_年"]) || 35;

        // 主債務者の他借入のみを明確に指定
        const mainExistingDebtMonthly = pick(filters, [
            "他借入の返済額_万円_月",
            "他借入の返済額（万円／月）"
        ]) || 0;
        const mainExistingDebt = toNumberLike(mainExistingDebtMonthly) * 12;

        const loanRequestAmount = pick(filters, ["借入希望額（万円）", "借入希望額_万円"]);
        const henpiChokaCheck = pick(filters, ["返比超過"]);

        // 🔥 型を明示的に定義（計算結果付きの型）
        type LoanWithCalculation = HousingLoan & {
            calculationResult?: LoanCalculationResult | null;
            combinedCalculationResult?: LoanCalculationResult | null;
        };

        // 先に借入可能額計算を行う
        let loansWithCalculation: LoanWithCalculation[] = allLoans.map((loan): LoanWithCalculation => {
            let calculationResult: LoanCalculationResult | null = null;
            let combinedCalculationResult: LoanCalculationResult | null = null;

            // 主債務者の計算
            if (annualIncome && !isNaN(toNumberLike(annualIncome))) {
                const income = toNumberLike(annualIncome);
                const period = toNumberLike(loanPeriodYears);
                const debt = toNumberLike(mainExistingDebt);

                if (loan.screening_rate && (loan.debt_ratio_0_399 || loan.debt_ratio_400_plus)) {
                    const params: LoanCalculationParams = {
                        annualIncome: income,
                        screeningRate: loan.screening_rate,
                        debtRatio0_399: loan.debt_ratio_0_399,
                        debtRatio400Plus: loan.debt_ratio_400_plus,
                        loanPeriodYears: period,
                        existingDebtAnnual: debt,
                        requestedYears: toNumberLike(pick(filters, ["借入希望年数"])) || undefined,
                        age: toNumberLike(pick(filters, ["年齢"])) || undefined,
                        maxRepaymentAge: loan.max_repayment_age || undefined,
                        maxLoanPeriodYears: loan.max_loan_period_years || undefined
                    };

                    calculationResult = calculateMaxLoanAmount(params);
                }
            }

            // 合算者の計算
            if (combinedAnnualIncome && !isNaN(toNumberLike(combinedAnnualIncome))) {
                const combinedIncome = toNumberLike(combinedAnnualIncome);
                const period = toNumberLike(loanPeriodYears);

                const loanOwnership = pick(filters, ["借入名義"]);
                const combinedEmploymentType = pick(filters, ["雇用形態（合算者）"]);
                const isPreMarriageFilter = pick(filters, ["婚姻前"]); // チェックボックス

                let combinedEmploymentValid = true;

                // 🔥 追加：最低年収チェック（ペアローンの場合のみ）
                if (loanOwnership === "ペアローン" && loan.min_annual_income_man_yen && combinedIncome < loan.min_annual_income_man_yen) {
                    combinedEmploymentValid = false; // 最低年収を下回る場合は0円にする
                }

                // 🔥 修正：借入名義が「婚姻前合算」の場合のみ銀行対応をチェック
                if (isPreMarriageFilter) {
                    const supportsPreMarriage = loan["pre_marriage_consolidation"];
                    if (!supportsPreMarriage || supportsPreMarriage !== "○") {
                        combinedEmploymentValid = false; // 計算を0円にする
                    }
                }
                // 🔥 追加：合算者の団信チェック
                const combinedDanshin = pick(filters, ["団信（合算者）"]);
                if (combinedDanshin && combinedEmploymentValid) {
                    let combinedDanshinSupported = false;

                    switch (combinedDanshin) {
                        case "一般団信":
                            combinedDanshinSupported = loan["general_group_insurance"] === "○";
                            break;
                        case "がん100":
                            combinedDanshinSupported = loan["cancer_group_insurance_100"] === "○";
                            break;
                        case "3大疾病":
                            combinedDanshinSupported = loan["three_major_diseases_plus"] === "○";
                            break;
                        case "無団信":
                            combinedDanshinSupported = loan["general_insurance_non_participation"] === "○";
                            break;
                        case "ワイド団信":
                            combinedDanshinSupported = loan["wide_group_insurance"] === "○";
                            break;
                        default:
                            combinedDanshinSupported = true;
                            break;
                    }

                    // 対応していない場合は計算を0円にする
                    if (!combinedDanshinSupported) {
                        combinedEmploymentValid = false;
                    }
                }
                if (combinedEmploymentValid) {
                    const combinedJibyou = pick(filters, ["持病の有無（合算者）"]);
                    if (combinedJibyou) {
                        const supportsWideDanshin = loan["wide_group_insurance"] === "○";
                        const supportsMudanshin = loan["general_insurance_non_participation"] === "○";

                        // ワイド団信または無団信のいずれかが○である必要
                        if (!supportsWideDanshin && !supportsMudanshin) {
                            combinedEmploymentValid = false;
                        }
                    }
                }
                // 雇用形態チェック（婚姻前合算で既に無効でない場合のみ）
                if (combinedEmploymentValid && combinedEmploymentType && combinedEmploymentType !== "選択してください") {
                    // パート・アルバイトの場合は条件不適合
                    if (combinedEmploymentType === "パート" || combinedEmploymentType === "アルバイト") {
                        combinedEmploymentValid = false;
                    } else {
                        // 銀行の雇用形態勤続フィールドをチェック
                        if (!checkCombinedEmploymentSupport(loan, combinedEmploymentType)) {
                            combinedEmploymentValid = false;
                        } else {
                            // 勤続期間のチェック
                            const combinedTenure = pick(filters, ["勤続_合算者"]);
                            if (combinedTenure && combinedTenure !== "選択してください") {
                                const combinedTenureMonths = convertTenureToMonths(combinedTenure);
                                if (combinedTenureMonths > 0) {
                                    if (!checkCombinedTenureRequirement(loan, combinedEmploymentType, combinedTenureMonths)) {
                                        combinedEmploymentValid = false;
                                    }
                                }
                            }
                        }
                    }
                }

                // 🔥 修正：雇用条件が無効な場合は計算を行わず、0円にする
                if (!combinedEmploymentValid) {
                    combinedCalculationResult = {
                        maxLoanAmount: 0,
                        monthlyPayment: 0,
                        applicableDebtRatio: 0,
                        calculationDetails: {
                            annualIncome: combinedIncome,
                            applicableDebtRatio: 0,
                            maxAnnualPayment: 0,
                            screeningRate: loan.screening_rate || 0,
                            loanPeriodYears: period
                        }
                    };
                } else {
                    // 雇用条件が有効な場合は通常の計算を実行
                    const combinedExistingDebtMonthly = pick(filters, [
                        "他借入の返済額_万円_月_合算者",
                        "他借入の返済額（万円／月）（合算者）"
                    ]) || 0;
                    const combinedExistingDebt = toNumberLike(combinedExistingDebtMonthly) * 12;

                    if (loan.screening_rate && (loan.debt_ratio_0_399 || loan.debt_ratio_400_plus)) {
                        // 借入名義をチェックして年齢を決定
                        const loanOwnership = pick(filters, ["借入名義"]);
                        let ageForCalculation = toNumberLike(pick(filters, ["年齢_合算者", "年齢（合算者）"])) || undefined;

                        // 収入合算（連帯債務・連帯保証）の場合は主債務者の年齢を使用
                        if (loanOwnership === "収入合算(連帯債務)" || loanOwnership === "収入合算(連帯保証)") {
                            ageForCalculation = toNumberLike(pick(filters, ["年齢"])) || undefined;
                        }

                        const combinedParams: LoanCalculationParams = {
                            annualIncome: combinedIncome,
                            screeningRate: loan.screening_rate,
                            debtRatio0_399: loan.debt_ratio_0_399,
                            debtRatio400Plus: loan.debt_ratio_400_plus,
                            loanPeriodYears: period,
                            existingDebtAnnual: combinedExistingDebt,
                            requestedYears: toNumberLike(pick(filters, ["借入希望年数"])) || undefined,
                            age: ageForCalculation,
                            maxRepaymentAge: loan.max_repayment_age || undefined,
                            maxLoanPeriodYears: loan.max_loan_period_years || undefined
                        };

                        combinedCalculationResult = calculateMaxLoanAmount(combinedParams);
                    }
                }
            }

            return {
                ...loan,
                calculationResult,
                combinedCalculationResult
            };
        });

        // 返比超過チェックによるフィルタリング
        if (loanRequestAmount && !isNaN(toNumberLike(loanRequestAmount))) {
            const requestAmountManYen = toNumberLike(loanRequestAmount);

            loansWithCalculation = loansWithCalculation.filter((loan) => {
                // 返比超過チェックがONの場合は全て通す
                if (henpiChokaCheck) {
                    return true;
                }

                // 借入名義を取得
                const loanOwnership = pick(filters, ["借入名義"]);

                // 合計借入可能額がある場合（両方の計算結果がある場合）
                if (loan.calculationResult && loan.combinedCalculationResult) {
                    const totalAmount = loan.calculationResult.maxLoanAmount + loan.combinedCalculationResult.maxLoanAmount;
                    return totalAmount >= requestAmountManYen;
                }
                // 主債務者のみの場合
                else if (loan.calculationResult) {
                    return loan.calculationResult.maxLoanAmount >= requestAmountManYen;
                }
                // 合算者のみの場合
                else if (loan.combinedCalculationResult) {
                    return loan.combinedCalculationResult.maxLoanAmount >= requestAmountManYen;
                }

                // 計算結果がない場合は従来の条件で判定
                return !loan.max_loan_amount || (requestAmountManYen * 10000) <= loan.max_loan_amount;
            });
        }
        // 🔥 追加: パスワード画面コンポーネント

        // その他の条件でフィルタリング
        // その他の条件でフィルタリング
        let filteredResult = filterLoans(loansWithCalculation, filters);

        // ソート処理
        const sortOption = pick(filters, ["ソート"]);
        if (sortOption) {
            filteredResult = [...filteredResult].sort((a, b) => {
                switch (sortOption) {
                    case "適用金利":
                        // 適用金利が低い順（昇順）
                        const aRate = a.interest_rate || Infinity;
                        const bRate = b.interest_rate || Infinity;
                        return aRate - bRate;

                    case "借入可能額":
                        // 借入可能額が高い順（降順）
                        const aAmount = (() => {
                            if (a.calculationResult && a.combinedCalculationResult) {
                                return a.calculationResult.maxLoanAmount + a.combinedCalculationResult.maxLoanAmount;
                            } else if (a.calculationResult) {
                                return a.calculationResult.maxLoanAmount;
                            } else if (a.combinedCalculationResult) {
                                return a.combinedCalculationResult.maxLoanAmount;
                            }
                            return 0;
                        })();

                        const bAmount = (() => {
                            if (b.calculationResult && b.combinedCalculationResult) {
                                return b.calculationResult.maxLoanAmount + b.combinedCalculationResult.maxLoanAmount;
                            } else if (b.calculationResult) {
                                return b.calculationResult.maxLoanAmount;
                            } else if (b.combinedCalculationResult) {
                                return b.combinedCalculationResult.maxLoanAmount;
                            }
                            return 0;
                        })();

                        return bAmount - aAmount; // 高い順（降順）

                    default:
                        return 0; // ソートなし
                }
            });


        }

        return filteredResult;
    }, [allLoans, filters]);

    // フィルター更新ハンドラ
    const handleFilterChange = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
    };

    // クリアハンドラ（追加）
    const handleClearFilters = () => {
        setFilters({});
        setClearTrigger(prev => prev + 1);
    };
    if (!isAuthenticated) {
        return <PasswordScreen onAuthenticated={() => setIsAuthenticated(true)} />;
    }
    // フォーマット関数
    const formatRate = (rate: number | null) => {
        if (rate === null) return '-';
        return `${rate.toFixed(3)}%`;
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';

        const manYen = amount / 10000;

        // 1億円（10,000万円）以上の場合は億円表示
        if (manYen >= 10000) {
            const okuYen = manYen / 10000;
            return `${okuYen.toLocaleString()}億円`;
        }

        return `${manYen.toLocaleString()}万円`;
    };

    return (
        <div className="min-h-screen gradient-hero bg-grid">
            <style>{GLOBAL_CSS}</style>

            {/* ヘッダー：LoanFit ロゴ + ナビゲーション */}
            <header className={`fixed top-0 left-0 right-0 z-20 backdrop-blur border-b border-white/30 dark:border-white/10 transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <div className="flex items-end justify-between mb-2">
                        {/* 左：ブランド塊（LoanFit＋by）＋ 右にサブタイトル */}
                        <div className="flex items-end gap-3">
                            {/* LoanFit＋by を縦に */}
                            <div className="flex flex-col leading-none">
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                    <span className="brand-text">LoanFit</span>
                                </h1>
                                <div className="-mt-1">
                                    <SupportedBy label="by" />
                                </div>
                            </div>

                            {/* サブタイトルを同じ行に */}
                            <span className="text-slate-700 dark:text-slate-200 text-base md:text-lg whitespace-nowrap">
                                住宅ローン候補検索
                            </span>
                        </div>

                        {/* 右：ナビ（そのまま） */}
                        <nav className="flex items-center gap-3">
                            {/* ソート選択 */}
                            <select
                                value={filters["ソート"] || ""}
                                onChange={(e) => setFilters({ ...filters, ソート: e.target.value })}
                                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                                <option value="">ソート選択</option>
                                <option value="適用金利">適用金利</option>
                                <option value="借入可能額">借入可能額</option>
                            </select>

                            {/* 返比超過チェックボックス */}
                            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={Boolean(filters["返比超過"])}
                                    onChange={(e) => setFilters({ ...filters, 返比超過: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">返比超過</span>
                            </label>

                            {/* 条件クリアボタン */}
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 border border-slate-300 dark:border-slate-600"
                            >
                                条件クリア
                            </button>
                        </nav>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        ※本サービスで表示される銀行候補・金利はあくまで参考情報です。実際の融資可否や条件は各銀行の審査・最新情報に基づきますので、必ずご自身でご確認ください。
                    </p>
                </div>
            </header>

            {/* メインコンテンツ：左フィルター / 右結果一覧 */}
            <main className="mx-auto max-w-7xl px-4 py-6 pt-32 grid gap-8 grid-cols-1 lg:grid-cols-4">

                {/* 左：検索条件（sticky） */}
                <aside className="lg:col-span-1 lg:pr-2">          <div className="glass rounded-2xl p-5">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">検索条件</h2>
                    {/* リアルタイムフィルタリング用フォーム */}
                    <SearchForm
                        key={clearTrigger}
                        onSubmit={handleFilterChange}
                        realTime={true}
                    />
                    {/* フィルター結果統計 */}
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {loading ? "読み込み中..." : (
                                <div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {filteredLoansWithCalculation.length} / {allLoans.length} 件
                                    </div>
                                    <div className="text-xs mt-1">
                                        条件に一致する商品
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </aside>

                {/* 右：検索結果一覧 */}
                <section className="lg:col-span-3 space-y-4 lg:pl-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            住宅ローン一覧
                        </h2>
                        <div className="text-sm text-slate-500">
                            金利順で表示中
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
                        <>
                            {filteredLoansWithCalculation.length === 0 ? (
                                <div className="glass rounded-xl p-8 text-center">
                                    <div className="text-slate-400 mb-2">
                                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-600 mb-2">条件に一致する住宅ローンが見つかりませんでした</p>
                                    <p className="text-sm text-slate-500">検索条件を緩めて再度お試しください</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredLoansWithCalculation.map((loan) => (
                                        <article
                                            key={loan.id}
                                            className="glass rounded-xl p-6 card-hover cursor-pointer"
                                            onClick={() => {
                                                console.log('🔥 Card clicked!');
                                                console.log('🔥 loan.id:', loan.id);
                                                console.log('🔥 loan.bank_name:', loan.bank_name);

                                                setSelectedLoan(loan);
                                                setSelectedBankId(loan.id);

                                                console.log('🔥 After setState called');
                                            }}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                                {/* 銀行名と基本情報 */}
                                                <div className="md:col-span-2">
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                                        {loan.bank_name}
                                                    </h3>

                                                    <div className="flex items-center gap-3 mb-3">
                                                        {loan.interest_type && (
                                                            <span className={`pill ${loan.interest_type === '変動' ? 'status-variable' : 'status-fixed'
                                                                }`}>
                                                                {loan.interest_type}金利
                                                            </span>
                                                        )}
                                                        {loan.preliminary_screening_method && (
                                                            <span className="pill">
                                                                {loan.preliminary_screening_method}審査
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* 最低年収警告メッセージ */}
                                                    {(loan as any).incomeWarning && (
                                                        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                            <div className="flex items-start gap-2">
                                                                <div className="text-red-600 dark:text-red-400 mt-0.5">
                                                                    ❌
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                                                                        年収条件について
                                                                    </div>
                                                                    <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                                                                        {(loan as any).incomeWarning}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(loan as any).conEmploymentWarning && (
                                                        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                            <div className="flex items-start gap-2">
                                                                <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                                                                    ⚠️
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                                                        融資条件について
                                                                    </div>
                                                                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                                        {(loan as any).conEmploymentWarning}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(loan as any).combinedEmploymentWarning && (
                                                        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                            <div className="flex items-start gap-2">
                                                                <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                                                                    ⚠️
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                                        合算者の条件について
                                                                    </div>
                                                                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                                        {(loan as any).combinedEmploymentWarning}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}


                                                    {/*{loan.features && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                            {loan.features}
                                                        </p>
                                                    )}*/}

                                                    {/* 合計借入可能額表示（特徴の下） */}
                                                    {/* 借入可能額と希望額の表示（単独・単身・合算すべてに対応） */}
                                                    {(loan.calculationResult || loan.combinedCalculationResult) && (
                                                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {/* 左側：借入可能額 */}
                                                                <div>
                                                                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">
                                                                        {loan.calculationResult && loan.combinedCalculationResult ? "合計借入可能額" : "借入可能額"}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                                                                        {(() => {
                                                                            const loanOwnership = pick(filters, ["借入名義"]);
                                                                            const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                            // 両方ある場合（合算）
                                                                            if (loan.calculationResult && loan.combinedCalculationResult) {
                                                                                if (loanOwnership === "ペアローン" && maxLoanAmountManYen) {
                                                                                    const mainAmount = Math.min(loan.calculationResult.maxLoanAmount, maxLoanAmountManYen);
                                                                                    const combinedAmount = Math.min(loan.combinedCalculationResult.maxLoanAmount, maxLoanAmountManYen);
                                                                                    const totalAmount = mainAmount + combinedAmount;

                                                                                    const mainExceeded = loan.calculationResult.maxLoanAmount > maxLoanAmountManYen;
                                                                                    const combinedExceeded = loan.combinedCalculationResult.maxLoanAmount > maxLoanAmountManYen;

                                                                                    if (mainExceeded || combinedExceeded) {
                                                                                        return `${formatLoanAmount(totalAmount)} (上限適用)`;
                                                                                    }
                                                                                    return formatLoanAmount(totalAmount);
                                                                                } else {
                                                                                    const totalAmount = loan.calculationResult.maxLoanAmount + loan.combinedCalculationResult.maxLoanAmount;
                                                                                    if (maxLoanAmountManYen && totalAmount > maxLoanAmountManYen) {
                                                                                        return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                    }
                                                                                    return formatLoanAmount(totalAmount);
                                                                                }
                                                                            }
                                                                            // 主債務者のみの場合（単独・単身）
                                                                            else if (loan.calculationResult) {
                                                                                const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                                if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                    return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                }
                                                                                return formatLoanAmount(mainAmount);
                                                                            }
                                                                            // 合算者のみの場合
                                                                            else if (loan.combinedCalculationResult) {
                                                                                const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                    return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                }
                                                                                return formatLoanAmount(combinedAmount);
                                                                            }
                                                                            return "-";
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                                                                        {(() => {
                                                                            const loanOwnership = pick(filters, ["借入名義"]);
                                                                            const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                            // 両方ある場合（合算）
                                                                            if (loan.calculationResult && loan.combinedCalculationResult) {
                                                                                if (loanOwnership === "ペアローン" && maxLoanAmountManYen) {
                                                                                    const mainExceeded = loan.calculationResult.maxLoanAmount > maxLoanAmountManYen;
                                                                                    const combinedExceeded = loan.combinedCalculationResult.maxLoanAmount > maxLoanAmountManYen;

                                                                                    const mainMonthly = mainExceeded
                                                                                        ? Math.floor(loan.calculationResult.monthlyPayment * (maxLoanAmountManYen / loan.calculationResult.maxLoanAmount))
                                                                                        : loan.calculationResult.monthlyPayment;

                                                                                    const combinedMonthly = combinedExceeded
                                                                                        ? Math.floor(loan.combinedCalculationResult.monthlyPayment * (maxLoanAmountManYen / loan.combinedCalculationResult.maxLoanAmount))
                                                                                        : loan.combinedCalculationResult.monthlyPayment;

                                                                                    const totalMonthly = mainMonthly + combinedMonthly;

                                                                                    if (mainExceeded || combinedExceeded) {
                                                                                        return `合計月々 ${totalMonthly.toLocaleString()}円 (上限適用)`;
                                                                                    }
                                                                                    return `合計月々 ${totalMonthly.toLocaleString()}円`;
                                                                                } else {
                                                                                    const totalAmount = loan.calculationResult.maxLoanAmount + loan.combinedCalculationResult.maxLoanAmount;
                                                                                    const totalMonthly = loan.calculationResult.monthlyPayment + loan.combinedCalculationResult.monthlyPayment;

                                                                                    if (maxLoanAmountManYen && totalAmount > maxLoanAmountManYen) {
                                                                                        const ratio = maxLoanAmountManYen / totalAmount;
                                                                                        const adjustedMonthly = Math.floor(totalMonthly * ratio);
                                                                                        return `合計月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                    }
                                                                                    return `合計月々 ${totalMonthly.toLocaleString()}円`;
                                                                                }
                                                                            }
                                                                            // 主債務者のみの場合（単独・単身）
                                                                            else if (loan.calculationResult) {
                                                                                const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                                if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                    const ratio = maxLoanAmountManYen / mainAmount;
                                                                                    const adjustedMonthly = Math.floor(loan.calculationResult.monthlyPayment * ratio);
                                                                                    return `月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                }
                                                                                return `月々 ${loan.calculationResult.monthlyPayment.toLocaleString()}円`;
                                                                            }
                                                                            // 合算者のみの場合
                                                                            else if (loan.combinedCalculationResult) {
                                                                                const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                    const ratio = maxLoanAmountManYen / combinedAmount;
                                                                                    const adjustedMonthly = Math.floor(loan.combinedCalculationResult.monthlyPayment * ratio);
                                                                                    return `月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                }
                                                                                return `月々 ${loan.combinedCalculationResult.monthlyPayment.toLocaleString()}円`;
                                                                            }
                                                                            return "-";
                                                                        })()}
                                                                    </div>
                                                                </div>

                                                                {/* 右側：借入希望額 */}
                                                                {(() => {
                                                                    const requestAmount = pick(filters, ["借入希望額（万円）", "借入希望額_万円"]);
                                                                    if (requestAmount && !isNaN(toNumberLike(requestAmount))) {
                                                                        const requestAmountVal = toNumberLike(requestAmount);

                                                                        // 希望額時の返済額を計算（簡易版：比例計算）
                                                                        let totalPossibleAmount = 0;
                                                                        let totalPossibleMonthly = 0;

                                                                        if (loan.calculationResult && loan.combinedCalculationResult) {
                                                                            // 両方ある場合
                                                                            totalPossibleAmount = loan.calculationResult.maxLoanAmount + loan.combinedCalculationResult.maxLoanAmount;
                                                                            totalPossibleMonthly = loan.calculationResult.monthlyPayment + loan.combinedCalculationResult.monthlyPayment;
                                                                        } else if (loan.calculationResult) {
                                                                            // 主債務者のみ
                                                                            totalPossibleAmount = loan.calculationResult.maxLoanAmount;
                                                                            totalPossibleMonthly = loan.calculationResult.monthlyPayment;
                                                                        } else if (loan.combinedCalculationResult) {
                                                                            // 合算者のみ
                                                                            totalPossibleAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                            totalPossibleMonthly = loan.combinedCalculationResult.monthlyPayment;
                                                                        }

                                                                        if (totalPossibleAmount > 0) {
                                                                            const requestRatio = requestAmountVal / totalPossibleAmount;
                                                                            const requestMonthly = Math.floor(totalPossibleMonthly * requestRatio);

                                                                            return (
                                                                                <div>
                                                                                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">
                                                                                        借入希望額
                                                                                    </div>
                                                                                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                                                                                        {formatLoanAmount(requestAmountVal)}
                                                                                    </div>
                                                                                    <div className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                                                                                        希望額時 月々 {requestMonthly.toLocaleString()}円
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
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

                                                    {/* 借入可能額表示エリア */}
                                                    {(loan.calculationResult || loan.combinedCalculationResult) && (
                                                        <div className="space-y-3">
                                                            {/* 主債務者のみの場合 */}
                                                            {loan.calculationResult && !loan.combinedCalculationResult && (
                                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                                                        借入可能額（主債務者）
                                                                    </div>
                                                                    <div className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                                                        {(() => {
                                                                            const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                            const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                            if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                            }
                                                                            return formatLoanAmount(mainAmount);
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                                                                        {(() => {
                                                                            const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                            const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                            if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                // 融資上限が適用される場合の月々返済額を計算
                                                                                const ratio = maxLoanAmountManYen / mainAmount;
                                                                                const adjustedMonthly = Math.floor(loan.calculationResult.monthlyPayment * ratio);
                                                                                return `月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                            }
                                                                            return `月々 ${loan.calculationResult.monthlyPayment.toLocaleString()}円`;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 個別表示部分の修正 */}
                                                            {/* 合算者のみの場合 */}
                                                            {!loan.calculationResult && loan.combinedCalculationResult && (
                                                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                    <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                                                                        借入可能額（合算者）
                                                                    </div>
                                                                    {/* 🔥 修正：合算者が0円の場合 */}
                                                                    {loan.combinedCalculationResult.maxLoanAmount === 0 ? (
                                                                        <div>
                                                                            <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                                                                0万円
                                                                            </div>
                                                                            <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                                                                                条件を満たしません
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <div className="text-sm font-bold text-green-800 dark:text-green-200">
                                                                                {(() => {
                                                                                    const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                    const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                    if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                        return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                    }
                                                                                    return formatLoanAmount(combinedAmount);
                                                                                })()}
                                                                            </div>
                                                                            <div className="text-xs text-green-500 dark:text-green-300 mt-1">
                                                                                月々 {(() => {
                                                                                    const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                    const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                    if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                        const ratio = maxLoanAmountManYen / combinedAmount;
                                                                                        const adjustedMonthly = Math.floor(loan.combinedCalculationResult.monthlyPayment * ratio);
                                                                                        return `${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                    }
                                                                                    return `${loan.combinedCalculationResult.monthlyPayment.toLocaleString()}円`;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 両方ある場合のグリッドレイアウト修正 */}
                                                            {loan.calculationResult && loan.combinedCalculationResult && (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {/* 主債務者 */}
                                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                                                            借入可能額（主債務者）
                                                                        </div>
                                                                        <div className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                                                            {(() => {
                                                                                const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                                const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                    return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                }
                                                                                return formatLoanAmount(mainAmount);
                                                                            })()}
                                                                        </div>
                                                                        <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                                                                            {(() => {
                                                                                const mainAmount = loan.calculationResult.maxLoanAmount;
                                                                                const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                if (maxLoanAmountManYen && mainAmount > maxLoanAmountManYen) {
                                                                                    const ratio = maxLoanAmountManYen / mainAmount;
                                                                                    const adjustedMonthly = Math.floor(loan.calculationResult.monthlyPayment * ratio);
                                                                                    return `月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                }
                                                                                return `月々 ${loan.calculationResult.monthlyPayment.toLocaleString()}円`;
                                                                            })()}
                                                                        </div>
                                                                    </div>

                                                                    {/* 合算者 */}
                                                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                        <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                                                                            借入可能額（合算者）
                                                                        </div>
                                                                        {/* 🔥 修正：合算者が0円の場合 */}
                                                                        {loan.combinedCalculationResult.maxLoanAmount === 0 ? (
                                                                            <div>
                                                                                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                                                                    0万円
                                                                                </div>
                                                                                <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                                                                                    条件を満たしません
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <div className="text-sm font-bold text-green-800 dark:text-green-200">
                                                                                    {(() => {
                                                                                        const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                        const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                        if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                            return `${formatLoanAmount(maxLoanAmountManYen)} (上限適用)`;
                                                                                        }
                                                                                        return formatLoanAmount(combinedAmount);
                                                                                    })()}
                                                                                </div>
                                                                                <div className="text-xs text-green-500 dark:text-green-300 mt-1">
                                                                                    {(() => {
                                                                                        const combinedAmount = loan.combinedCalculationResult.maxLoanAmount;
                                                                                        const maxLoanAmountManYen = loan.max_loan_amount ? loan.max_loan_amount / 10000 : null;

                                                                                        if (maxLoanAmountManYen && combinedAmount > maxLoanAmountManYen) {
                                                                                            const ratio = maxLoanAmountManYen / combinedAmount;
                                                                                            const adjustedMonthly = Math.floor(loan.combinedCalculationResult.monthlyPayment * ratio);
                                                                                            return `月々 ${adjustedMonthly.toLocaleString()}円 (上限適用)`;
                                                                                        }
                                                                                        return `月々 ${loan.combinedCalculationResult.monthlyPayment.toLocaleString()}円`;
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}


                                                            {/* 返比超過の警告表示 */}
                                                            {loan.calculationResult && (() => {
                                                                const loanRequestAmount = pick(filters, ["借入希望額（万円）", "借入希望額_万円"]);
                                                                const henpiChokaCheck = pick(filters, ["返比超過"]);
                                                                if (loanRequestAmount && henpiChokaCheck && !isNaN(toNumberLike(loanRequestAmount))) {
                                                                    const requestAmount = toNumberLike(loanRequestAmount);
                                                                    if (loan.calculationResult.maxLoanAmount < requestAmount) {
                                                                        return (
                                                                            <div className="text-xs text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                                ⚠ 借入希望額が借入可能額を超えています
                                                                            </div>
                                                                        );
                                                                    }
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 条件詳細 */}
                                                <div className="space-y-2 text-sm">
                                                    {/* 既存の条件表示 */}
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

                                                    {/* 主債務者の借り入れ可能年数表示 */}
                                                    {(() => {
                                                        const age = toNumberLike(pick(filters, ["年齢"]));

                                                        if (age && !isNaN(age) && loan.max_repayment_age && loan.max_loan_period_years) {
                                                            const maxPossibleYears = loan.max_repayment_age - age;
                                                            const availableYears = Math.min(loan.max_loan_period_years, maxPossibleYears);

                                                            return (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">借入可能年数（主）:</span>
                                                                    <span className={`font-medium ${availableYears > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {availableYears > 0 ? `${availableYears}年` : '借入不可'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* 合算者の借り入れ可能年数表示 */}
                                                    {(() => {
                                                        const loanOwnership = pick(filters, ["借入名義"]);
                                                        let combinedAge;

                                                        // 収入合算（連帯債務・連帯保証）の場合は主債務者の年齢を使用
                                                        if (loanOwnership === "収入合算(連帯債務)" || loanOwnership === "収入合算(連帯保証)") {
                                                            combinedAge = toNumberLike(pick(filters, ["年齢"]));
                                                        } else {
                                                            combinedAge = toNumberLike(pick(filters, ["年齢_合算者", "年齢（合算者）"]));
                                                        }

                                                        if (combinedAge && !isNaN(combinedAge) && loan.max_repayment_age && loan.max_loan_period_years) {
                                                            const maxPossibleYears = loan.max_repayment_age - combinedAge;
                                                            const availableYears = Math.min(loan.max_loan_period_years, maxPossibleYears);

                                                            return (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">借入可能年数（合算）:</span>
                                                                    <span className={`font-medium ${availableYears > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {availableYears > 0 ? `${availableYears}年` : '借入不可'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* 借入希望年数の警告表示（主債務者） */}
                                                    {(() => {
                                                        const age = toNumberLike(pick(filters, ["年齢"]));
                                                        const requestedYears = toNumberLike(pick(filters, ["借入希望年数"]));

                                                        if (age && requestedYears && !isNaN(age) && !isNaN(requestedYears) &&
                                                            loan.max_repayment_age && loan.max_loan_period_years) {
                                                            const maxPossibleYears = loan.max_repayment_age - age;
                                                            const availableYears = Math.min(loan.max_loan_period_years, maxPossibleYears);

                                                            if (requestedYears > availableYears) {
                                                                return (
                                                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                                            ⚠ 希望年数の借入ができません（主債務者）
                                                                        </div>
                                                                        <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                                                                            最大{availableYears}年まで可能
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* 借入希望年数の警告表示（合算者） */}
                                                    {(() => {
                                                        const loanOwnership = pick(filters, ["借入名義"]);
                                                        let combinedAge;

                                                        // 収入合算（連帯債務・連帯保証）の場合は主債務者の年齢を使用
                                                        if (loanOwnership === "収入合算(連帯債務)" || loanOwnership === "収入合算(連帯保証)") {
                                                            combinedAge = toNumberLike(pick(filters, ["年齢"]));
                                                        } else {
                                                            combinedAge = toNumberLike(pick(filters, ["年齢_合算者", "年齢（合算者）"]));
                                                        }

                                                        const requestedYears = toNumberLike(pick(filters, ["借入希望年数"]));

                                                        if (combinedAge && requestedYears && !isNaN(combinedAge) && !isNaN(requestedYears) &&
                                                            loan.max_repayment_age && loan.max_loan_period_years) {
                                                            const maxPossibleYears = loan.max_repayment_age - combinedAge;
                                                            const availableYears = Math.min(loan.max_loan_period_years, maxPossibleYears);

                                                            if (requestedYears > availableYears) {
                                                                return (
                                                                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                                                            ⚠ 希望年数の借入ができません（合算者）
                                                                        </div>
                                                                        <div className="text-xs text-yellow-500 dark:text-yellow-300 mt-1">
                                                                            最大{availableYears}年まで可能
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()}

                                                    {/* 返済比率情報 
                                                    {(loan.calculationResult || loan.combinedCalculationResult) && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                            {loan.calculationResult && (
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-slate-500">適用返済比率（主）:</span>
                                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                        {loan.calculationResult.applicableDebtRatio}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {loan.combinedCalculationResult && (
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">適用返済比率（合算）:</span>
                                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                                        {loan.combinedCalculationResult.applicableDebtRatio}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}*/}
                                                </div>

                                                {/* 団信情報 */}
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 md:col-span-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-500">一般団信:</span>
                                                            <span className={`font-medium ${loan.general_group_insurance === '○' ? 'text-green-600' : 'text-slate-400'
                                                                }`}>
                                                                {loan.general_group_insurance || '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-500">ワイド団信:</span>
                                                            <span className={`font-medium ${loan.wide_group_insurance === '○' ? 'text-green-600' : 'text-slate-400'
                                                                }`}>
                                                                {loan.wide_group_insurance || '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-500">がん団信:</span>
                                                            <span className={`font-medium ${loan.cancer_group_insurance_100 === '○' ? 'text-green-600' : 'text-slate-400'
                                                                }`}>
                                                                {loan.cancer_group_insurance_100 || '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-500">三大疾病:</span>
                                                            <span className={`font-medium ${loan.three_major_diseases_plus === '○' ? 'text-green-600' : 'text-slate-400'
                                                                }`}>
                                                                {loan.three_major_diseases_plus || '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 団信詳細情報 */}
                                                    <div className="space-y-2 text-xs">
                                                        {loan["general_group_insurance_features"] && (
                                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">一般団信特徴: </span>
                                                                <span className="text-slate-600 dark:text-slate-400">{loan["general_group_insurance_features"]}</span>
                                                            </div>
                                                        )}

                                                        {loan["wide_group_insurance_conditions"] && (
                                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">ワイド団信条件: </span>
                                                                <span className="text-slate-600 dark:text-slate-400">{loan["wide_group_insurance_conditions"]}</span>
                                                            </div>
                                                        )}

                                                        {loan["cancer_group_insurance_100_notes"] && (
                                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">がん団信備考: </span>
                                                                <span className="text-slate-600 dark:text-slate-400">{loan["cancer_group_insurance_100_notes"]}</span>
                                                            </div>
                                                        )}

                                                        {loan["three_major_diseases_plus_conditions"] && (
                                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">三大疾病条件: </span>
                                                                <span className="text-slate-600 dark:text-slate-400">{loan["three_major_diseases_plus_conditions"]}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>


            </main>




            {/* 銀行詳細モーダル */}
            <BankDetailModal
                loan={selectedLoan}
                onClose={() => {
                    setSelectedLoan(null);
                    setSelectedBankId(null); // ボタンも同時に非表示
                }}
            />
        </div>

    );

}

