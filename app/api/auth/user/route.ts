import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password, next } = await req.json();
  const ok = password && password === process.env.USER_PASS;
  if (!ok) return new NextResponse("Unauthorized", { status: 401 });

  const res = NextResponse.json({ redirectTo: next || "/user" });
  // /user 配下だけに効くよう Path="/user" でセット
  res.cookies.set("auth_user", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/user",      // 重要：/user配下にのみ送出
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8
  });
  return res;
}
