import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sessionSchema } from "@/lib/validations/session"
import { SessionTipo } from "@/generated/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const lojaSession = await prisma.lojaSession.findUnique({
    where: { id },
    include: {
      presencas: {
        include: { member: { select: { id: true, nome: true, cim: true, posicao: true, situacao: true } } },
        orderBy: [{ member: { posicao: "asc" } }, { member: { nome: "asc" } }],
      },
    },
  })
  if (!lojaSession) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(lojaSession)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = sessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const lojaSession = await prisma.lojaSession.update({
    where: { id },
    data: {
      data: new Date(parsed.data.data),
      descricao: parsed.data.descricao ?? null,
      tipo: (parsed.data.tipo ?? "ORDINARIA") as SessionTipo,
    },
  })
  return NextResponse.json(lojaSession)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.lojaSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
