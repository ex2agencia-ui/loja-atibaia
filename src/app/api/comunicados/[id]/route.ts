import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const ROLES_ENVIAR = ["ADMIN", "SECRETARIO", "CHANCELARIA"]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const user = session.user as any
  const isAdmin = ROLES_ENVIAR.includes(user?.role)

  const comunicado = await prisma.comunicado.findUnique({
    where: { id },
    include: {
      autor: { select: { id: true, name: true, email: true, role: true } },
      destinatarios: {
        include: { member: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!comunicado) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  // Membro só acessa se for destinatário
  if (!isAdmin) {
    const isDest = comunicado.destinatarios.some(d => d.memberId === user?.memberId)
    if (!isDest) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

    // Marca como lido automaticamente
    await prisma.comunicadoDestinatario.updateMany({
      where: { comunicadoId: id, memberId: user.memberId, lidoEm: null },
      data: { lidoEm: new Date() },
    })
  }

  return NextResponse.json(comunicado)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any
  if (!ROLES_ENVIAR.includes(user?.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { id } = await params
  await prisma.comunicado.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
