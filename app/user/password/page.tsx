import PasswordScreen from "@/components/PasswordScreen";

export default async function RootPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <PasswordScreen
      postUrl="/api/auth/user"
      title="（サイト全体）アクセス保護"
      hint="運営会社名"
      defaultNext="/"
      nextParam={params?.next}
    />
  );
}
