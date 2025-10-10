"use client";

import React from "react";

const COLORS = {
  blue: "#007FFF",
  gold: "#FFD700",
  red: "#ff0000",
};

type Props = {
  label?: string;
  href?: string;
};

export default function SupportedBy({ label = "by", href }: Props) {
  const Brand = (
    <span
      className="font-bold tracking-wide"
      style={{
        textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.8)'
      }}
      aria-label="Vivalapartner"
      title="Vivalapartner"
    >
      <span style={{ color: COLORS.blue }}>Vi</span>
      <span style={{ color: COLORS.gold }}>va</span>
      <span style={{ color: COLORS.red }}>la</span>
      <span style={{ color: COLORS.blue }}>partner</span>
    </span>
  );

  return (
    <div className="mt-1 text-xs sm:text-sm text-slate-500 flex items-center gap-2 whitespace-nowrap">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" className="hover:opacity-80 transition-opacity">
          {Brand}
        </a>
      ) : (
        Brand
      )}
    </div>
  );
}