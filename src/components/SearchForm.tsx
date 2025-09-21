// SearchForm.tsx 動的フィールド表示対応版

"use client";
import { useState, useEffect } from "react";
import inputFields from "@/data/inputFields.json";

type Field = {
    id: string;
    label: string;
    type: "number" | "text" | "select" | "checkbox" | "button";
    required?: boolean;
    options?: string[];
    unit?: string;
    min?: number;
    max?: number;
    placeholder?: string;
};

export default function SearchForm({
    onSubmit,
    realTime = false
}: {
    onSubmit: (values: Record<string, any>) => void;
    realTime?: boolean;
}) {
    const [values, setValues] = useState<Record<string, any>>({});
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        funding: false,
        employment: false,
        details: false,
        property: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };


    // 🔥 新規追加：借入名義に応じて表示するフィールドを判定
    const shouldShowField = (fieldId: string): boolean => {
        const loanOwnership = values["借入名義"];

        // ペアローン専用フィールド（合算者の個別条件）
        const pairLoanOnlyFields = [
            "年齢_合算者",
            "借入希望年数_合算者",
            "雇用形態（合算者）",
            "勤続_合算者",
            "代表_合算者",
            "自営_合算者",
            "産休育休_合算者",
            "持病の有無（合算者）",
            "団信（合算者）"
        ];

        // 収入合算系で表示するフィールド（年収と他借入は表示）
        const incomeConsolidationFields = [
            "年収_合算者",
            "他借入の返済額_万円_月_合算者",

        ];

        // 🔥 修正：合算者関連フィールドの判定のみ行い、主債務者フィールドは影響しない
        const isCollaboratorField = [...pairLoanOnlyFields, ...incomeConsolidationFields].includes(fieldId);

        // 合算者フィールドでない場合は常に表示（主債務者のフィールド等）
        if (!isCollaboratorField) {
            return true;
        }

        // 以下は合算者フィールドの場合の判定

        // ペアローンの場合：すべての合算者フィールドを表示
        if (loanOwnership === "ペアローン") {
            return true;
        }

        // 収入合算（連帯債務・連帯保証）の場合：年収と他借入のみ表示
        if (loanOwnership === "収入合算(連帯債務)" || loanOwnership === "収入合算(連帯保証)") {
            return incomeConsolidationFields.includes(fieldId);
        }

        // 婚姻前合算の場合：年収と他借入のみ表示
        if (loanOwnership === "婚姻前合算") {
            return incomeConsolidationFields.includes(fieldId);
        }

        // 単独名義・単身者・未選択の場合：合算者フィールドは非表示
        return false;
    };

    // フィールドをカテゴリに分類
    const getFieldCategory = (fieldId: string): string | null => {
        const fundingFields = [
            "借入希望額_万円", "物件価格_万円", "諸経費_万円",
            "総額表示", "自己資金額"
        ];

        const employmentFields = [
            "雇用形態", "雇用形態（合算者）", "勤続", "勤続_合算者",
            "代表", "代表_合算者", "自営", "自営_合算者",
            "産休育休", "産休育休_合算者"
        ];

        const detailFields = [
            "変動・固定",
            "持病の有無", "持病の有無（合算者）", "団信", "団信（合算者）",
            "親族居住用融資", "婚姻前", "永住権なし", "lgbtq", "事実婚",
            "融資範囲の入力", "諸費用込ローン", "リフォーム", "買替（買い先行）",
            "つなぎ融資", "おまとめローン"
        ];

        const propertyFields = [
            "再建築不可", "築年（年）ex 1998", "借地権", "既存不適格",
            "専有面積", "自主管理"
        ];

        if (fundingFields.includes(fieldId)) return "funding";
        if (employmentFields.includes(fieldId)) return "employment";
        if (detailFields.includes(fieldId)) return "details";
        if (propertyFields.includes(fieldId)) return "property";
        return null; // 基本フィールド（常に表示）
    };



    // 全角→半角、カンマ除去して数値変換
    const toNumber = (v: any): number => {
        if (typeof v === 'number') return v;
        const s = String(v ?? "").replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        const n = s.replace(/[,，\s]/g, "");
        const num = parseFloat(n);
        return isNaN(num) ? 0 : num;
    };

    const handleChange = (id: string, value: any) => {
        let newValues = { ...values, [id]: value };

        // 🔥 修正：条件を明確に分離して、意図しない処理を防ぐ

        // 1. 借入希望年数の処理（年齢警告）
        if (id === "借入希望年数") {
            const age = toNumber(values["年齢"]);
            if (!age || age <= 0) {
                newValues["_ageWarning"] = true;
            } else {
                newValues["_ageWarning"] = false;
            }
        }
        // 2. 年齢入力時の警告クリア
        else if (id === "年齢" && value) {
            newValues["_ageWarning"] = false;
        }
        // 3. 物件価格の処理
        else if (id === "物件価格_万円") {
            const propertyPrice = toNumber(value);
            const expenses = toNumber(values["諸経費_万円"]);
            const total = propertyPrice + expenses;

            if (total > 0) {
                newValues["総額表示"] = total.toLocaleString();

                // 借入希望額がある場合のみ自己資金を計算
                const loanAmount = toNumber(values["借入希望額_万円"]);
                if (loanAmount > 0) {
                    const selfFunding = Math.max(0, total - loanAmount);
                    newValues["自己資金額"] = selfFunding.toLocaleString();
                }
            } else {
                newValues["総額表示"] = "";
            }
        }
        // 4. 諸経費の処理
        else if (id === "諸経費_万円") {
            const propertyPrice = toNumber(values["物件価格_万円"]);
            const expenses = toNumber(value);
            const total = propertyPrice + expenses;

            if (total > 0) {
                newValues["総額表示"] = total.toLocaleString();

                // 借入希望額がある場合のみ自己資金を計算
                const loanAmount = toNumber(values["借入希望額_万円"]);
                if (loanAmount > 0) {
                    const selfFunding = Math.max(0, total - loanAmount);
                    newValues["自己資金額"] = selfFunding.toLocaleString();
                }
            } else {
                newValues["総額表示"] = "";
            }
        }
        // 5. 借入希望額の処理
        else if (id === "借入希望額_万円") {
            const loanAmount = toNumber(value);
            const totalAmount = toNumber(String(values["総額表示"]).replace(/[,，]/g, ""));

            if (loanAmount > 0 && totalAmount > 0) {
                const selfFunding = Math.max(0, totalAmount - loanAmount);
                newValues["自己資金額"] = selfFunding.toLocaleString();
            } else if (loanAmount === 0 || !value) {
                newValues["自己資金額"] = "";
            }
        }
        // 6. その他のフィールドの場合は何も追加処理をしない

        setValues(newValues);

        // リアルタイムモードの場合は即座に親に通知
        if (realTime) {
            onSubmit(newValues);
        }
    };

    // 🔥 修正：handleSubmit関数を追加
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!realTime) {
            onSubmit(values);
        }
    };

    const filteredFields = inputFields as Field[];

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 基本フィールド（常に表示） */}
                {filteredFields.map((f) => {
                    if (f.type === "button") return null;
                    if (!shouldShowField(f.id)) return null;
                    if (getFieldCategory(f.id) !== null) return null; // カテゴリフィールドは後で表示

                    return (
                        <div key={f.id} className="flex flex-col">
                            <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                {f.label}
                                {f.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {f.type === "select" ? (
                                <select
                                    value={(values[f.id] ?? "") as string}
                                    onChange={(e) => handleChange(f.id, e.target.value)}
                                    required={!!f.required}
                                    className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                >
                                    <option value="">選択してください</option>
                                    {f.id === "借入名義" ? (
                                        <>
                                            <option value="単独名義（所帯有）">単独名義（所帯有）</option>
                                            <option value="単身者">単身者</option>
                                            <option value="ペアローン">ペアローン</option>
                                            <option value="収入合算(連帯債務)">収入合算(連帯債務)</option>
                                            <option value="収入合算(連帯保証)">収入合算(連帯保証)</option>
                                        </>
                                    ) : f.id === "変動・固定" ? (
                                        <>
                                            <option value="変動">変動金利</option>
                                            <option value="固定">固定金利</option>
                                        </>
                                    ) : (
                                        f.options?.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))
                                    )}
                                </select>
                            ) : f.type === "checkbox" ? (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(values[f.id])}
                                        onChange={(e) => handleChange(f.id, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">適用する</span>
                                </label>
                            ) : f.id === "総額表示" ? (
                                <div className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 min-h-[38px] flex items-center">
                                    {values[f.id] ? `${values[f.id]}万円` : "物件価格と諸経費を入力すると自動計算されます"}
                                </div>
                            ) : f.id === "自己資金額" ? (
                                <div className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 min-h-[38px] flex items-center">
                                    {values[f.id] ? `${values[f.id]}万円` : "総額と借入希望額を入力すると自動計算されます"}
                                </div>
                            ) : f.id === "借入希望年数" ? (
                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={(values[f.id] ?? "") as string}
                                        onChange={(e) => handleChange(f.id, e.target.value)}
                                        required={!!f.required}
                                        placeholder="希望する借入年数を入力"
                                        className={`rounded-xl border px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm w-full ${values["_ageWarning"] ? 'border-red-300' : 'border-slate-200'
                                            }`}
                                    />
                                    {values["_ageWarning"] && (
                                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            年齢を記入してください
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    inputMode={f.type === "number" ? "numeric" : undefined}
                                    value={(values[f.id] ?? "") as string}
                                    onChange={(e) => handleChange(f.id, e.target.value)}
                                    required={!!f.required}
                                    placeholder={
                                        f.placeholder ??
                                        (f.type === "number" ? "数字を入力" : "")
                                    }
                                    className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                />
                            )}

                            {f.unit && (
                                <span className="text-xs text-gray-500 mt-1">単位: {f.unit}</span>
                            )}
                        </div>
                    );
                })}

                {/* 資金計画セクション */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('funding')}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                    >
                        資金計画
                        <span className={`transform transition-transform ${expandedSections.funding ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                    {expandedSections.funding && (
                        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                            {filteredFields.map((f) => {
                                if (f.type === "button") return null;
                                if (!shouldShowField(f.id)) return null;
                                if (getFieldCategory(f.id) !== "funding") return null;

                                return (
                                    <div key={f.id} className="flex flex-col">
                                        <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                            {f.label}
                                            {f.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {f.id === "総額表示" ? (
                                            <div className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 min-h-[38px] flex items-center">
                                                {values[f.id] ? `${values[f.id]}万円` : "物件価格と諸経費を入力すると自動計算されます"}
                                            </div>
                                        ) : f.id === "自己資金額" ? (
                                            <div className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 min-h-[38px] flex items-center">
                                                {values[f.id] ? `${values[f.id]}万円` : "総額と借入希望額を入力すると自動計算されます"}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                placeholder={f.placeholder ?? "数字を入力"}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>


                {/* 職業情報入力セクション */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('employment')}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                    >
                        職業情報入力
                        <span className={`transform transition-transform ${expandedSections.employment ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                    {expandedSections.employment && (
                        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                            {filteredFields.map((f) => {
                                if (f.type === "button") return null;
                                if (!shouldShowField(f.id)) return null;
                                if (getFieldCategory(f.id) !== "employment") return null;

                                return (
                                    <div key={f.id} className="flex flex-col">
                                        <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                            {f.label}
                                            {f.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {f.type === "select" ? (
                                            <select
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            >
                                                <option value="">選択してください</option>
                                                {f.id === "雇用形態" || f.id === "雇用形態（合算者）" ? (
                                                    <>
                                                        <option value="正社員">正社員</option>
                                                        <option value="契約">契約社員</option>
                                                        <option value="派遣">派遣社員</option>
                                                        <option value="パート">パート・アルバイト</option>
                                                    </>
                                                ) : (
                                                    f.options?.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        ) : f.type === "checkbox" ? (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(values[f.id])}
                                                    onChange={(e) => handleChange(f.id, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">適用する</span>
                                            </label>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode={f.type === "number" ? "numeric" : undefined}
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                placeholder={f.placeholder ?? (f.type === "number" ? "数字を入力" : "")}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 詳細条件セクション */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('details')}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                    >
                        詳細条件
                        <span className={`transform transition-transform ${expandedSections.details ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                    {expandedSections.details && (
                        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                            {filteredFields.map((f) => {
                                if (f.type === "button") return null;
                                if (!shouldShowField(f.id)) return null;
                                if (getFieldCategory(f.id) !== "details") return null;

                                return (
                                    <div key={f.id} className="flex flex-col">
                                        <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                            {f.label}
                                            {f.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {f.type === "select" ? (
                                            <select
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            >
                                                <option value="">選択してください</option>
                                                {f.options?.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : f.type === "checkbox" ? (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(values[f.id])}
                                                    onChange={(e) => handleChange(f.id, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">適用する</span>
                                            </label>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode={f.type === "number" ? "numeric" : undefined}
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                placeholder={f.placeholder ?? (f.type === "number" ? "数字を入力" : "")}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 物件情報入力セクション */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('property')}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                    >
                        物件情報入力
                        <span className={`transform transition-transform ${expandedSections.property ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                    {expandedSections.property && (
                        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                            {filteredFields.map((f) => {
                                if (f.type === "button") return null;
                                if (!shouldShowField(f.id)) return null;
                                if (getFieldCategory(f.id) !== "property") return null;

                                return (
                                    <div key={f.id} className="flex flex-col">
                                        <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                            {f.label}
                                            {f.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {f.type === "select" ? (
                                            <select
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            >
                                                <option value="">選択してください</option>
                                                {f.options?.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : f.type === "checkbox" ? (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(values[f.id])}
                                                    onChange={(e) => handleChange(f.id, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">適用する</span>
                                            </label>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode={f.type === "number" ? "numeric" : undefined}
                                                value={(values[f.id] ?? "") as string}
                                                onChange={(e) => handleChange(f.id, e.target.value)}
                                                required={!!f.required}
                                                placeholder={f.placeholder ?? (f.type === "number" ? "数字を入力" : "")}
                                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {!realTime && (
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        候補をチェック
                    </button>
                )}
            </form>


        </div>
    );
}