// SearchForm.tsx 詳細まで検索できる版

"use client";
import { useState, useEffect } from "react";
import inputFields from "@/data/inputFields user.json";
import React from "react";



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

    const shouldShowField = (fieldId: string): boolean => {
        const loanOwnership = values["借入名義"];

        const pairLoanOnlyFields = [
            "年齢_合算者",
            "借入希望年数_合算者",
            "雇用形態(合算者)",
            "勤続_合算者",
            "代表_合算者",
            "自営_合算者",
            "産休育休_合算者",
            "持病の有無(合算者)",
            "団信(合算者)"
        ];

        const incomeConsolidationFields = [
            "年収_合算者",
            "他借入の返済額_万円_月_合算者",
        ];

        const isCollaboratorField = [...pairLoanOnlyFields, ...incomeConsolidationFields].includes(fieldId);

        if (!isCollaboratorField) {
            return true;
        }

        if (loanOwnership === "ペアローン") {
            return true;
        }

        if (loanOwnership === "収入合算(連帯債務)" || loanOwnership === "収入合算(連帯保証)") {
            return incomeConsolidationFields.includes(fieldId);
        }

        if (loanOwnership === "婚姻前合算") {
            return incomeConsolidationFields.includes(fieldId);
        }

        return false;
    };

    const getFieldCategory = (fieldId: string): string | null => {
        const fundingFields = [
            "借入名義",
            "年収_合算者",
            "他借入の返済額_万円_月_合算者",
            "借入希望年数_合算者",
            "年齢_合算者",
            "借入希望年数",
            "他借入の返済額_万円_月",
            "物件価格_万円",
            "諸経費_万円",
            "総額表示",
            "自己資金額",
            // 📥 合算者の資金計画フィールドを追加

        ];

        const employmentFields = [
            "雇用形態", "雇用形態(合算者)", "勤続", "勤続_合算者",
            "代表", "代表_合算者", "自営", "自営_合算者",
            "産休育休", "産休育休_合算者"
        ];

        const detailFields = [
            "変動・固定",
            "持病の有無", "持病の有無(合算者)", "団信", "団信(合算者)",
            "親族居住用融資", "婚姻前", "永住権なし", "lgbtq", "事実婚",
            "融資範囲の入力", "諸費用込ローン", "リフォーム", "買替(買い先行)",
            "つなぎ融資", "おまとめローン"
        ];

        const propertyFields = [
            "再建築不可", "築年(年)ex 1998", "借地権", "既存不適格",
            "専有面積", "自主管理"
        ];

        if (fundingFields.includes(fieldId)) return "funding";
        if (employmentFields.includes(fieldId)) return "employment";
        if (detailFields.includes(fieldId)) return "details";
        if (propertyFields.includes(fieldId)) return "property";
        return null;
    };

    const toNumber = (v: any): number => {
        if (typeof v === 'number') return v;
        const s = String(v ?? "").replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        const n = s.replace(/[,、\s]/g, "");
        const num = parseFloat(n);
        return isNaN(num) ? 0 : num;
    };

    const handleChange = (id: string, value: any) => {
        let newValues = { ...values, [id]: value };

        if (id === "借入希望年数") {
            const age = toNumber(values["年齢"]);
            if (!age || age <= 0) {
                newValues["_ageWarning"] = true;
            } else {
                newValues["_ageWarning"] = false;
            }
        }
        else if (id === "年齢" && value) {
            newValues["_ageWarning"] = false;
        }
        else if (id === "物件価格_万円") {
            const propertyPrice = toNumber(value);
            const expenses = toNumber(values["諸経費_万円"]);
            const total = propertyPrice + expenses;

            if (total > 0) {
                newValues["総額表示"] = total.toLocaleString();

                const loanAmount = toNumber(values["借入希望額_万円"]);
                if (loanAmount > 0) {
                    const selfFunding = Math.max(0, total - loanAmount);
                    newValues["自己資金額"] = selfFunding.toLocaleString();
                }
            } else {
                newValues["総額表示"] = "";
            }
        }
        else if (id === "諸経費_万円") {
            const propertyPrice = toNumber(values["物件価格_万円"]);
            const expenses = toNumber(value);
            const total = propertyPrice + expenses;

            if (total > 0) {
                newValues["総額表示"] = total.toLocaleString();

                const loanAmount = toNumber(values["借入希望額_万円"]);
                if (loanAmount > 0) {
                    const selfFunding = Math.max(0, total - loanAmount);
                    newValues["自己資金額"] = selfFunding.toLocaleString();
                }
            } else {
                newValues["総額表示"] = "";
            }
        }
        else if (id === "借入希望額_万円") {
            const loanAmount = toNumber(value);
            const totalAmount = toNumber(String(values["総額表示"]).replace(/[,、]/g, ""));

            if (loanAmount > 0 && totalAmount > 0) {
                const selfFunding = Math.max(0, totalAmount - loanAmount);
                newValues["自己資金額"] = selfFunding.toLocaleString();
            } else if (loanAmount === 0 || !value) {
                newValues["自己資金額"] = "";
            }
        }

        setValues(newValues);

        if (realTime) {
            onSubmit(newValues);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!realTime) {
            onSubmit(values);
        }
    };

    const filteredFields = inputFields as Field[];

    // 📥 デフォルト表示フィールドのID配列(表示順)
    const defaultDisplayFields = ["年収_万円", "年齢", "借入希望額_万円"];

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 📥 デフォルト表示フィールド(年収、年齢、借入希望額) */}
                {defaultDisplayFields.map((fieldId) => {
                    const f = filteredFields.find(field => field.id === fieldId);
                    if (!f || f.type === "button") return null;

                    return (
                        <div key={f.id} className="flex flex-col">
                            <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                {f.label}
                                {f.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                value={(values[f.id] ?? "") as string}
                                onChange={(e) => handleChange(f.id, e.target.value)}
                                required={!!f.required}
                                placeholder={f.placeholder ?? "数字を入力"}
                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                            />

                            {f.unit && (
                                <span className="text-xs text-gray-500 mt-1">単位: {f.unit}</span>
                            )}
                        </div>
                    );
                })}

                {/* ソート */}
                {filteredFields.map((f) => {
                    if (f.id !== "ソート") return null;

                    return (
                        <div key={f.id} className="flex flex-col">
                            <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                {f.label}
                            </label>

                            <select
                                value={(values[f.id] ?? "") as string}
                                onChange={(e) => handleChange(f.id, e.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                            >
                                <option value="">選択してください</option>
                                <option value="適用金利">適用金利</option>
                                <option value="借入可能額">借入可能額</option>
                            </select>
                        </div>
                    );
                })}

                {/* 返比超過チェックボックス */}
                {filteredFields.map((f) => {
                    if (f.id !== "返比超過") return null;

                    return (
                        <div key={f.id} className="flex flex-col">
                            <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                {f.label}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={Boolean(values[f.id])}
                                    onChange={(e) => handleChange(f.id, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">適用する</span>
                            </label>
                        </div>
                    );
                })}



                {/* 📥 資金計画セクション(借入名義、借入希望年数、他借入を含む) */}
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
                                // ボタン型は今はスキップ
                                if (f.type === "button") return null;

                                // 🔥 資金計画カテゴリーのフィールドのみ表示
                                if (getFieldCategory(f.id) !== "funding") return null;

                                // デフォルト表示フィールドは除外（上部に既に表示されているため）
                                if (defaultDisplayFields.includes(f.id)) return null;

                                // 合算者項目の除外処理
                                const loanOwnership = values["借入名義"];
                                const isCombinedField = ["年収(合算者)", "年収_合算者", "年齢(合算者)", "年齢_合算者", "借入希望年数(合算者)", "借入希望年数_合算者"].includes(f.id);

                                if (isCombinedField) {
                                    return null;
                                }
                                return (
                                    <React.Fragment key={f.id}>
                                        <div className="flex flex-col">
                                            <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                                {f.label}
                                                {f.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {/* 既存のフィールドレンダリング */}
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
                                                            <option value="婚姻前合算">婚姻前合算</option>
                                                        </>
                                                    ) : f.id === "雇用形態" ? (
                                                        <>
                                                            <option value="正社員">正社員</option>
                                                            <option value="契約">契約社員</option>
                                                            <option value="派遣">派遣社員</option>
                                                            <option value="パート">パート・アルバイト</option>
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
                                                    placeholder={f.placeholder ?? (f.type === "number" ? "数字を入力" : "")}
                                                    className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                                />
                                            )}

                                            {f.unit && (
                                                <span className="text-xs text-gray-500 mt-1">単位: {f.unit}</span>
                                            )}
                                        </div>

                                        {/* 🔥 借入名義の直後に合算者項目を動的表示 */}
                                        {f.id === "借入名義" && loanOwnership && ["ペアローン", "収入合算(連帯債務)", "収入合算(連帯保証)", "婚姻前合算"].includes(loanOwnership) && (
                                            <div className="ml-4 pl-4 border-l-2 border-purple-300 space-y-4 mt-4">
                                                <div className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                                                    合算者情報
                                                </div>

                                                {/* 年収（合算者） */}
                                                <div className="flex flex-col">
                                                    <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                                        年収（合算者）
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={(values["年収_合算者"] || values["年収(合算者)"] || "") as string}
                                                        onChange={(e) => handleChange("年収_合算者", e.target.value)}
                                                        placeholder="合算者の年収を入力"
                                                        className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                                    />
                                                </div>

                                                {/* 年齢（合算者） */}
                                                <div className="flex flex-col">
                                                    <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                                        年齢（合算者）
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={(values["年齢_合算者"] || values["年齢(合算者)"] || "") as string}
                                                        onChange={(e) => handleChange("年齢_合算者", e.target.value)}
                                                        placeholder="合算者の年齢を入力"
                                                        className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                                    />
                                                </div>

                                                {/* 借入希望年数（合算者） */}
                                                <div className="flex flex-col">
                                                    <label className="mb-1 font-medium text-sm text-slate-700 dark:text-slate-300">
                                                        借入希望年数（合算者）
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={(values["借入希望年数_合算者"] || values["借入希望年数(合算者)"] || "") as string}
                                                        onChange={(e) => handleChange("借入希望年数_合算者", e.target.value)}
                                                        placeholder="合算者の借入希望年数を入力"
                                                        className="rounded-xl border border-slate-200 px-3 py-2 bg-white/90 dark:bg-slate-900/70 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
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
                                                {f.id === "雇用形態" || f.id === "雇用形態(合算者)" ? (
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