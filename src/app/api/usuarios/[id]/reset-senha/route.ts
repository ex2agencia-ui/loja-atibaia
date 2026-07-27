import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_USUARIOS } from "@/lib/permissions"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS)
  if (err) return err

  const { id } = await params
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { id },
    include: { member: { select: { cim: true } } },
  })
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const cim = user.member?.cim
  if (!cim) return NextResponse.json({ error: "Usuário não tem membro vinculado com CIM" }, { status: 400 })

  const hashed = await bcrypt.hash(cim, 12)
  await prisma.user.update({
    where: { id },
    data: { password: hashed, mustChangePassword: true },
  })

  return NextResponse.json({ ok: true })
}
