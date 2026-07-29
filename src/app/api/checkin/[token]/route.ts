import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const lojaSession = await prisma.lojaSession.findUnique({
    where: { checkInToken: token },
    select: { id: true, data: true, tipo: true, descricao: true, checkInAberto: true },
  })
  if (!lojaSession) return NextResponse.json({ error: "Token inválido" }, { status: 404 })

  return NextResponse.json(lojaSession)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const memberId = (session.user as { memberId?: string | null }).memberId
  if (!memberId) return NextResponse.json({ error: "Conta não vinculada a um membro" }, { status: 403 })

  const { token } = await params

  const lojaSession = await prisma.lojaSession.findUnique({
    where: { checkInToken: token },
    select: { id: true, checkInAberto: true },
  })
  if (!lojaSession) return NextResponse.json({ error: "Token inválido" }, { status: 404 })
  if (!lojaSession.checkInAberto) return NextResponse.json({ error: "Check-in encerrado" }, { status: 403 })

  const existing = await prisma.presenca.findUnique({
    where: { memberId_sessionId: { memberId, sessionId: lojaSession.id } },
  })
  if (existing) return NextResponse.json({ jaRegistrado: true })

  await prisma.presenca.create({
    data: { memberId, sessionId: lojaSession.id, status: "P" },
  })

  return NextResponse.json({ ok: true })
}
