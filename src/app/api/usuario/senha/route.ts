import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  senhaAtual: z.string().optional(),
  novaSenha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { prisma } = await import("@/lib/prisma")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mustChange = (session.user as any).mustChangePassword as boolean

  // Se não é troca forçada, valida senha atual
  if (!mustChange) {
    if (!parsed.data.senhaAtual) {
      return NextResponse.json({ error: "Senha atual é obrigatória" }, { status: 400 })
    }
    const valid = await bcrypt.compare(parsed.data.senhaAtual, user.password ?? "")
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(parsed.data.novaSenha, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
