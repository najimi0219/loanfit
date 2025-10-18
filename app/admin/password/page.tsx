import PasswordScreen from "@/components/PasswordScreen";

export default function RootPasswordPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextParam = searchParams?.next;

  return (
    <PasswordScreen
      postUrl="/api/auth/admin"
      title="（管理画面）アクセス保護"
      hint="清水さんの一番大事なもの"
      defaultNext="/"
      nextParam={nextParam}
    />
  );
}
