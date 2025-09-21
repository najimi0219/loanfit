// scripts/excel-to-json.ts
import * as XLSX from "xlsx";
import { writeFileSync } from "fs";
import path from "path";

// === 設定（必要なら環境変数で上書き可） ===
const INPUT_XLSX = process.env.INPUT_XLSX ?? "loanfit 検索項目.xlsx"; // ルート直下に置く
const SHEET_NAME = process.env.SHEET ?? "入力項目";
const OUTPUT_JSON = process.env.OUTPUT_JSON ?? "src/data/inputFields.json";

// スラッグ化（日本語は残すがスペース/記号は_に）
const toSlug = (s: string) =>
  s.trim()
    .replace(/[（）]/g, (c) => (c === "（" ? "(" : ")"))
    .replace(/[ 　/／、,，|｜]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 80);

function detect(label: string, method: string) {
  const l = label ?? "";
  const m = method ?? "";

  // options 抽出
  const sep = ["/", "／", "、", ",", "，", "|", "｜"].find((sp) => m.includes(sp));
  const options = sep ? m.split(sep).map((s) => s.trim()).filter(Boolean) : undefined;

  // type 判定
  let type: "number" | "text" | "select" | "checkbox" | "button" = "text";
  if (/チェック|checkbox/i.test(m)) type = "checkbox";
  else if (/ボタン|クリック/i.test(m)) type = "button";
  else if (/プルダウン|選択|select|pull/i.test(m) || options) type = "select";
  else if (/(年収|年齢|金額|価格|借入|返済|頭金|期間|年|ヶ月|%|％|率)/.test(l) || /(数値|number|ナンバー)/i.test(m))
    type = "number";

  // unit 推定
  let unit: string | undefined;
  if (/万円|万 円|万/.test(l + m)) unit = "万円";
  else if (/円/.test(l + m)) unit = "円";
  else if (/%|％|率/.test(l + m)) unit = "%";
  else if (/ヶ月|か月|月/.test(l)) unit = "ヶ月";
  else if (/年/.test(l)) unit = "年";

  // 範囲
  let min: number | undefined;
  let max: number | undefined;
  const mm = /(\d+)\s*[~\-ー–]\s*(\d+)/.exec(l + m);
  if (mm) {
    min = +mm[1];
    max = +mm[2];
  } else {
    const ge = /(\d+)\s*以上/.exec(l + m);
    const le = /(\d+)\s*以下/.exec(l + m);
    if (ge) min = +ge[1];
    if (le) max = +le[1];
  }

  // placeholder
  const placeholder =
    type === "number"
      ? unit === "万円" || unit === "円"
        ? "例: 7000"
        : unit === "年" || unit === "ヶ月"
        ? "例: 35"
        : unit === "%"
        ? "例: 0.6"
        : "半角数字のみ"
      : type === "select"
      ? "選択してください"
      : undefined;

  const required = /必須|必/.test(m);
  return { type, options, unit, min, max, placeholder, required };
}

function main() {
  const xlsxPath = path.join(process.cwd(), INPUT_XLSX);
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`シート「${SHEET_NAME}」が見つかりません: ${xlsxPath}`);

  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const fields = rows
    .map((r: any) => {
      const label: string = String(r["検索項目"] ?? "").trim();
      if (!label) return null;
      const method: string = String(r["記入方式"] ?? "").trim();
      const { type, options, unit, min, max, placeholder, required } = detect(label, method);
      return {
        id: toSlug(label),
        label,
        type,
        required,
        options,
        unit,
        min,
        max,
        placeholder,
        meta_method: method,
      };
    })
    .filter(Boolean);

  writeFileSync(path.join(process.cwd(), OUTPUT_JSON), JSON.stringify(fields, null, 2), "utf8");
  console.log(`✅ 出力: ${OUTPUT_JSON}（${fields.length}項目）`);
}

main();
