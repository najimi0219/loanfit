import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "loanfit：住宅ローンの一括比較・審査プラットフォーム｜ゼロチェック",
};

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
