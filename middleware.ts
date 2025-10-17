// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 静的/内部パスは除外
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  const authedRoot = req.cookies.get("auth_root")?.value === "1";
  const authedUser = req.cookies.get("auth_user")?.value === "1";

  // ------------------------
  // /user 配下の保護
  // ------------------------
  if (pathname.startsWith("/user")) {
    // /user/password は例外
    if (pathname === "/user/password") {
      // 既に認証済みなら next へ or /user へ送り返す（←これがないとループ）
      if (authedUser) {
        const to = searchParams.get("next") || "/user";
        const url = req.nextUrl.clone();
        url.pathname = to;
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // 未認証なら /user/password に飛ばす（next 付き）
    if (!authedUser) {
      const url = req.nextUrl.clone();
      url.pathname = "/user/password";
      url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // ------------------------
  // ルート配下の保護（/password を含めた制御）
  // ------------------------

  // /password 自体は例外。認証済みなら next または / へ返す（←コレが無いと無限ループ）
  if (pathname === "/password") {
    if (authedRoot) {
      const to = searchParams.get("next") || "/";
      const url = req.nextUrl.clone();
      url.pathname = to;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // それ以外（= / 配下）。未認証なら /password へ（next 付き）
  if (!authedRoot) {
    const url = req.nextUrl.clone();
    url.pathname = "/password";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
