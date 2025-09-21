import { db } from "./client";
import { banks } from "./schema";

const rows = [
  {
    id: "flat35_g", name: "フラット35（保証型仮想）",
    maxLoanSingle: 8000, maxLoanPair: 16000, minEmploymentYears: 1,
    requirePermanent: false, minAnnualIncome: 200, dtiLimitBelow400: 30,
    dtiLimitAbove400: 35, screeningRate: 1.72, productRate: 1.72,
    maxAgeAtMaturity: 79, minAge: 20, maxTenor: 35, ltvLimit: 100,
    supportsPair: true, supportsVariable: false, supportsFixed: true,
    insurance: JSON.stringify({normal:true, wide:true, cancer:true}),
    notes: "自己資金割合で金利変動あり（簡略）。"
  },
  {
    id: "mega_a_var", name: "メガバンクA 変動型（仮想）",
    maxLoanSingle: 12000, maxLoanPair: 18000, minEmploymentYears: 2,
    requirePermanent: true, minAnnualIncome: 300, dtiLimitBelow400: 30,
    dtiLimitAbove400: 35, screeningRate: 3.0, productRate: 0.6,
    maxAgeAtMaturity: 80, minAge: 20, maxTenor: 35, ltvLimit: 90,
    supportsPair: true, supportsVariable: true, supportsFixed: false,
    insurance: JSON.stringify({normal:true, wide:true, cancer:true}),
    notes: "がん団信標準付帯。"
  },
];

async function main() {
  // 既存データ削除 → 追加（drizzleの簡易実行）
  // @ts-ignore - better-sqlite3 の簡易SQL
  await db.run(`delete from banks`);
  await db.insert(banks).values(rows).run();
  console.log("Seeded:", rows.length);
}
main();
