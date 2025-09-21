// app/api/evaluate/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { banks } from "@/db/schema";

type Input = {
  incomeSelf: number;       // 本人年収(万円)
  incomeSpouse?: number;    // 配偶者年収(万円)
  pairLoan?: boolean;       // 夫婦合算か
  age: number;              // 本人年齢
  propertyPrice: number;    // 物件価格(万円)
  downPayment: number;      // 頭金(万円)
  years: number;            // 返済年数
};

function monthlyPayment(principalYen: number, annualRatePct: number, years: number) {
  const r = (annualRatePct / 100) / 12;
  const n = years * 12;
  if (r === 0) return principalYen / n;
  return (principalYen * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export async function POST(req: Request) {
  const input = (await req.json()) as Input;

  const all = await db.select().from(banks).all();
  const loan = Math.max(0, input.propertyPrice - input.downPayment); // 万円
  const incomeHousehold = (input.pairLoan ? (input.incomeSelf + (input.incomeSpouse ?? 0)) : input.incomeSelf);

  const results = all.map(b => {
    const errs: string[] = [];

    // 借入上限
    const max = input.pairLoan ? b.maxLoanPair : b.maxLoanSingle;
    if (loan > max) errs.push("借入額が上限超過");

    // 年齢
    if (input.age < b.minAge) errs.push("年齢下限未満");
    if (input.age + input.years > b.maxAgeAtMaturity) errs.push("完済年齢制限超過");

    // 年収・勤続
    if (incomeHousehold < b.minAnnualIncome) errs.push("年収要件未満");
    // ※ 勤続年数を入力に増やしたら b.minEmploymentYears と照合

    // LTV
    const ltv = input.propertyPrice === 0 ? 0 : (loan / input.propertyPrice) * 100;
    if (ltv > b.ltvLimit) errs.push(`LTV ${ltv.toFixed(1)}% が上限(${b.ltvLimit}%)超過`);

    // DTI（審査金利でストレス）
    const stressMonthly = monthlyPayment(loan * 10000, Number(b.screeningRate), input.years);
    const dtiLimit = incomeHousehold < 400 ? b.dtiLimitBelow400 : b.dtiLimitAbove400;
    const allowedMonthly = (incomeHousehold * 10000 * (dtiLimit / 100)) / 12;
    if (stressMonthly > allowedMonthly) errs.push("返済比率オーバー");

    const execMonthly = monthlyPayment(loan * 10000, Number(b.productRate), input.years);

    return {
      id: b.id,
      name: b.name,
      productRate: b.productRate,
      eligible: errs.length === 0,
      errors: errs,
      execMonthly: Math.round(execMonthly),
      notes: b.notes,
    };
  })
  // 合格を上に、次に月返済が安い順
  .sort((a, b) => (a.eligible === b.eligible ? a.execMonthly - b.execMonthly : (a.eligible ? -1 : 1)));

  return NextResponse.json({ data: results });
}
