import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calcularSituacaoPresenca } from "@/lib/utils/presence"
import { requireRole, ROLES_RELATORIOS } from "@/lib/permissions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_RELATORIOS)
  if (err) return err

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const dateFilter = from && to
    ? { data: { gte: new Date(from), lte: new Date(to) } }
    : {}

  const sessions = await prisma.lojaSession.findMany({
    where: dateFilter,
    select: { id: true },
  })

  const sessionIds = sessions.map((s) => s.id)
  const totalSessoes = sessionIds.length

  const members = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    include: {
      presencas: {
        where: { sessionId: { in: sessionIds }, status: "F" },
        select: { id: true },
      },
    },
    orderBy: [{ posicao: "asc" }, { nome: "asc" }],
  })

  const relatorio = members.map((m) => {
    const faltas = m.presencas.length
    const calc = calcularSituacaoPresenca(totalSessoes, faltas)
    return {
      memberId: m.id,
      cim: m.cim,
      nome: m.nome,
      posicao: m.posicao,
      ...calc,
    }
  })

  return NextResponse.json({ relatorio, totalSessoes, from, to })
}
