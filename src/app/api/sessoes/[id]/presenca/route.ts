import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PresencaStatus } from "@/generated/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  // Get all active members + their presença for this session
  const members = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    include: {
      presencas: { where: { sessionId: id } },
    },
    orderBy: [{ posicao: "asc" }, { nome: "asc" }],
  })

  const result = members.map((m) => ({
    memberId: m.id,
    nome: m.nome,
    cim: m.cim,
    posicao: m.posicao,
    presenca: m.presencas[0] ?? null,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: sessionId } = await params
  const body = await req.json()
  const records: { memberId: string; status: string; observacao?: string }[] = body.records

  if (!Array.isArray(records)) {
    return NextResponse.json({ error: "records deve ser um array" }, { status: 400 })
  }

  const results = await Promise.all(
    records.map((r) =>
      prisma.presenca.upsert({
        where: { memberId_sessionId: { memberId: r.memberId, sessionId } },
        create: {
          memberId: r.memberId,
          sessionId,
          status: r.status as PresencaStatus,
          observacao: r.observacao ?? null,
        },
        update: {
          status: r.status as PresencaStatus,
          observacao: r.observacao ?? null,
        },
      })
    )
  )

  return NextResponse.json({ saved: results.length })
}
