import PasswordScreen from "@/components/PasswordScreen";

export default async function RootPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <PasswordScreen
      postUrl="/api/auth/user"
      title="アクセス保護"
      hint="パスワードがわからない人はお問い合わせください"
      defaultNext="/"
      nextParam={params?.next}
    />
  );
}
