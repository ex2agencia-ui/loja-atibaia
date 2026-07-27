import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  // Optimistic session check — actual validation happens in server components
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Role-based guards são feitos nos server components e API routes via auth()
  // O proxy só garante que há sessão; permissões granulares ficam no servidor

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/test|.*\\.png$).*)"],
}
