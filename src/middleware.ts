import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextAuthRequest } from "next-auth"

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl
  const session = req.auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any

  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (user) {
    const mustChange = user.mustChangePassword as boolean
    const role = user.role as string

    if (mustChange && pathname !== "/trocar-senha" && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/trocar-senha", req.url))
    }

    if (role === "MEMBRO") {
      const allowed = ["/perfil", "/trocar-senha", "/api/", "/sessoes"]
      const isAllowed = allowed.some((p) => pathname.startsWith(p)) || pathname === "/login"
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/perfil", req.url))
      }
    }

    if (pathname.startsWith("/usuarios") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
