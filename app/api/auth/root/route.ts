// app/api/auth/root/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";         // 任意：Edge実行（外してもOK）
export const dynamic = "force-dynamic"; // 任意：キャッシュ抑止（開発安定用）

export async function POST(req: NextRequest) {
  let payload: { password?: string; next?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const { password, next } = payload;
  const ok = typeof password === "string" && password === process.env.ROOT_PASS;

  if (!ok) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 認証OK → Cookie発行（ルート全体で有効）
  const res = NextResponse.json({
    redirectTo: next && next.trim() ? next : "/",
  });

  res.cookies.set("auth_root", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/", // ← 重要：/ 全体で有効にする
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8時間
  });

  return res;
}
