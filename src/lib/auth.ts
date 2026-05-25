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

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role
      return token
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (session.user) (session.user as any).role = token.role as string
      return session
    },
  },
})
