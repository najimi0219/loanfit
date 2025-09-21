type BankRow = {
    id: string;
    name: string;
    product: string;             // 変動 / 固定 / フラット35 等
    product_rate: number;        // ％（例 0.73）
    min_annual_income: number;   // 万円
    notes?: string | null;
    extra?: Record<string, any>; // ← 追加：未マップの全項目
  };
  // df: [{項目:'銀行名', 'auじぶん銀行':'...', 'りそな銀行':'...'}, ...]
const bankNames = Object.keys(df[0] || {}).filter((k) => k !== "項目");

banks = bankNames.map((colName, idx) => {
  const temp: any = {};
  const extra: Record<string, any> = {};

  for (const row of df) {
    const label = (row["項目"] || "").toString().trim();
    const val = row[colName];
    const mapped = ROW_MAP[label];
    if (mapped) {
      temp[mapped] = val;
    } else {
      // マップされていない項目は extra として保持
      extra[label] = val;
    }
  }

  const name = (temp.name ?? colName)?.toString().trim();
  const product = (temp.product ?? "").toString().trim();

  let rate = toNumberLike(temp.product_rate);
  if (rate <= 1 && rate > 0) rate *= 100;        // 0.0073 → 0.73 (%)
  const minInc = Math.round(toNumberLike(temp.min_annual_income));
  const id = (temp.id && String(temp.id)) || toIdFrom(name, product, `row_${idx + 1}`);

  if (!name || !product || !Number.isFinite(rate) || !Number.isFinite(minInc)) {
    throw new Error(`整形失敗: ${colName}`);
  }

  return {
    id,
    name,
    product,
    product_rate: rate,
    min_annual_income: minInc,
    notes: temp.notes ? String(temp.notes) : null,
    extra, // ← 未マップの全項目を保存
  } as BankRow;
});
const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

banks = rows.map((r: any, i: number) => {
  const o: any = {};
  const extra: Record<string, any> = {};

  for (const rawKey of Object.keys(r)) {
    const mapped = HEAD_MAP[rawKey.trim()];
    if (mapped) o[mapped] = r[rawKey];
    else extra[rawKey] = r[rawKey]; // 未マップは extra へ
  }

  o.id = o.id || toIdFrom(String(o.name || ""), String(o.product || ""), `row_${i + 1}`);

  let rate = toNumberLike(o.product_rate);
  if (rate <= 1 && rate > 0) rate *= 100;
  o.product_rate = rate;

  o.min_annual_income = Math.round(toNumberLike(o.min_annual_income));

  if (!o.name || !o.product || !Number.isFinite(o.product_rate) || !Number.isFinite(o.min_annual_income)) {
    throw new Error(`整形失敗: row ${i + 1}`);
  }

  o.extra = extra;  // ← 追加

  return o as BankRow;
});

const { error } = await supabase.from("banks").upsert(banks, { onConflict: "id" });

