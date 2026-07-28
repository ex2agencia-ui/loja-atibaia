import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@loja.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const safeCredentials = {
          email:
            typeof credentials?.email === "string"
              ? credentials.email.trim().toLowerCase()
              : "",
          password:
            typeof credentials?.password === "string"
              ? credentials.password
              : "",
        }

        if (process.env.NODE_ENV === "development") {
          console.debug("authorize credentials:", safeCredentials)
        }

        const parsed = loginSchema.safeParse(safeCredentials)
        if (!parsed.success) {
          if (process.env.NODE_ENV === "development") {
            console.debug("authorize validation failed:", parsed.error.format())
          }
          return null
        }

        // Dynamic import keeps Prisma out of the Edge/proxy bundle
        const { prisma } = await import("./prisma")
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, name: true, email: true, password: true, role: true, memberId: true, mustChangePassword: true },
        })
        if (!user?.password) {
          if (process.env.NODE_ENV === "development") {
            console.debug("authorize failed: user not found or missing password", parsed.data.email)
          }
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) {
          if (process.env.NODE_ENV === "development") {
            console.debug("authorize failed: invalid password for", parsed.data.email)
          }
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          memberId: user.memberId,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as { role: string; memberId?: string | null; mustChangePassword?: boolean }
        token.role = u.role
        token.memberId = u.memberId ?? null
        token.mustChangePassword = u.mustChangePassword ?? false
      }
      // Re-read from DB on session update or when role is missing
      if ((trigger === "update" || !token.role) && token.sub) {
        const { prisma } = await import("./prisma")
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, memberId: true, mustChangePassword: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.memberId = dbUser.memberId ?? null
          token.mustChangePassword = dbUser.mustChangePassword
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any
        u.id = token.sub as string
        u.role = token.role as string
        u.memberId = token.memberId as string | null
        u.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
})
