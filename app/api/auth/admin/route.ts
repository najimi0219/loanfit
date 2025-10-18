import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password, next } = await req.json();
  if (password !== process.env.ADMIN_PASS) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const res = NextResponse.json({ redirectTo: next || "/admin" });
  res.cookies.set("auth_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",                               // ← /admin配下だけ有効
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

