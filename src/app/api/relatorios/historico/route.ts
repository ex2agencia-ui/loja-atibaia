import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const dateFilter = from && to
    ? { data: { gte: new Date(from), lte: new Date(to) } }
    : {}

  const [sessions, members] = await Promise.all([
    prisma.lojaSession.findMany({
      where: dateFilter,
      select: { id: true, data: true, tipo: true },
      orderBy: { data: "asc" },
    }),
    prisma.member.findMany({
      where: { situacao: "ATIVO" },
      select: {
        id: true, cim: true, nome: true, posicao: true,
        presencas: {
          where: dateFilter
            ? { session: { data: { gte: new Date(from!), lte: new Date(to!) } } }
            : {},
          select: { sessionId: true, status: true },
        },
      },
      orderBy: [{ posicao: "asc" }, { nome: "asc" }],
    }),
  ])

  // Build lookup: memberId → { sessionId → status }
  const matrix = members.map((m) => {
    const bySession: Record<string, string> = {}
    for (const p of m.presencas) bySession[p.sessionId] = p.status
    return {
      memberId: m.id,
      cim: m.cim,
      nome: m.nome,
      posicao: m.posicao,
      presencas: bySession,
    }
  })

  return NextResponse.json({ sessions, matrix })
}
