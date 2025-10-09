"use client";

import React from "react";

const COLORS = {
  blue: "#007FFF",
  gold: "#FFD700",
  red:  "#ff0000"
};

type Props = {
  // 表記を変えたい時だけ差し替え
  label?: string; // 既定: "supported by"
  href?: string;  // 企業サイト等にリンクしたければ指定
};

export default function SupportedBy({ label = "by", href }: Props) {
  const Brand = (
    <span
      className="font-semibold tracking-wide"
      aria-label="Vivalapartner"
      title="Vivalapartner"
    >
      <span style={{ color: COLORS.blue }}>Vi</span>
      <span style={{ color: COLORS.gold }}>va</span>
      <span style={{ color: COLORS.red }}>la</span>
      <span style={{ color: COLORS.red }}>partner</span>
    </span>
  );

  return (
    <div className="mt-1 text-xs sm:text-sm text-slate-500 flex items-center gap-2 whitespace-nowrap">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" className="hover:underline">
          {Brand}
        </a>
      ) : (
        Brand
      )}
    </div>
  );
}
