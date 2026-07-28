import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any

  let membroNome: string | null = user?.name ?? null
  if (user?.memberId) {
    const membro = await prisma.member.findUnique({ where: { id: user.memberId }, select: { nome: true } })
    membroNome = membro?.nome ?? membroNome
  }

  return NextResponse.json({ role: user?.role ?? null, memberId: user?.memberId ?? null, membroNome })
}
