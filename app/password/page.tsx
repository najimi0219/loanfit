import PasswordScreen from "@/components/PasswordScreen";

export default function RootPasswordPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextParam = searchParams?.next;

  return (
    <PasswordScreen
      postUrl="/api/auth/root"
      title="（サイト全体）アクセス保護"
      hint="運営会社名"
      defaultNext="/"
      nextParam={nextParam}
    />
  );
}
