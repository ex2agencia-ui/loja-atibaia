import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  // Busca mensalidades VENCIDAS agrupadas por membro
  const vencidas = await prisma.mensalidade.findMany({
    where: { status: "VENCIDO" },
    select: {
      memberId: true,
      competencia: true,
      valorTotal: true,
      vencimento: true,
      member: {
        select: { id: true, nome: true, cim: true, telefone: true, isWhatsapp: true },
      },
    },
    orderBy: { competencia: "asc" },
  })

  // Agrupa por membro
  const porMembro = new Map<string, {
    membro: { id: string; nome: string; cim: string; telefone: string | null; isWhatsapp: boolean }
    competencias: string[]
    totalAberto: number
    vencimentoMaisAntigo: Date
  }>()

  for (const v of vencidas) {
    const entry = porMembro.get(v.memberId)
    if (entry) {
      entry.competencias.push(v.competencia)
      entry.totalAberto += Number(v.valorTotal)
      if (new Date(v.vencimento) < entry.vencimentoMaisAntigo) {
        entry.vencimentoMaisAntigo = new Date(v.vencimento)
      }
    } else {
      porMembro.set(v.memberId, {
        membro: v.member,
        competencias: [v.competencia],
        totalAberto: Number(v.valorTotal),
        vencimentoMaisAntigo: new Date(v.vencimento),
      })
    }
  }

  const inadimplentes = Array.from(porMembro.values())
    .map((e) => ({
      ...e.membro,
      mesesAtraso: e.competencias.length,
      competencias: e.competencias,
      totalAberto: e.totalAberto,
      vencimentoMaisAntigo: e.vencimentoMaisAntigo,
    }))
    .sort((a, b) => b.totalAberto - a.totalAberto)

  return NextResponse.json({ inadimplentes, total: inadimplentes.length })
}
