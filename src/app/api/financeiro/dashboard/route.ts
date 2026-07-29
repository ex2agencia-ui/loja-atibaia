import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // KPIs em paralelo
  const [
    arrecadadoMes,
    pendenteMes,
    receitasMes,
    despesasMes,
    totalMembrosAtivos,
    inadimplentesCount,
  ] = await Promise.all([
    prisma.mensalidade.aggregate({
      where: { competencia: mesAtual, status: "PAGO" },
      _sum: { valorTotal: true },
    }),
    prisma.mensalidade.aggregate({
      where: { competencia: mesAtual, status: { in: ["PENDENTE", "VENCIDO"] } },
      _sum: { valorTotal: true },
    }),
    prisma.transacaoCaixa.aggregate({
      where: { tipo: "RECEITA", data: { gte: inicioMes, lte: fimMes } },
      _sum: { valor: true },
    }),
    prisma.transacaoCaixa.aggregate({
      where: { tipo: "DESPESA", data: { gte: inicioMes, lte: fimMes } },
      _sum: { valor: true },
    }),
    prisma.member.count({ where: { situacao: "ATIVO" } }),
    prisma.mensalidade.groupBy({
      by: ["memberId"],
      where: { status: "VENCIDO" },
      _count: true,
    }),
  ])

  const inadimplentesTotal = inadimplentesCount.length
  const taxaInadimplencia =
    totalMembrosAtivos > 0 ? (inadimplentesTotal / totalMembrosAtivos) * 100 : 0

  const saldoCaixa =
    Number(receitasMes._sum.valor ?? 0) - Number(despesasMes._sum.valor ?? 0)

  // Série histórica: últimos 6 meses
  const meses: { competencia: string; label: string; inicio: Date; fim: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const comp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1)
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    meses.push({ competencia: comp, label, inicio, fim })
  }

  const historicoReceitas = await Promise.all(
    meses.map((m) =>
      prisma.transacaoCaixa.aggregate({
        where: { tipo: "RECEITA", data: { gte: m.inicio, lte: m.fim } },
        _sum: { valor: true },
      })
    )
  )

  const historicoDespesas = await Promise.all(
    meses.map((m) =>
      prisma.transacaoCaixa.aggregate({
        where: { tipo: "DESPESA", data: { gte: m.inicio, lte: m.fim } },
        _sum: { valor: true },
      })
    )
  )

  const historico = meses.map((m, i) => ({
    competencia: m.competencia,
    label: m.label,
    receitas: Number(historicoReceitas[i]._sum.valor ?? 0),
    despesas: Number(historicoDespesas[i]._sum.valor ?? 0),
  }))

  return NextResponse.json({
    kpis: {
      arrecadadoMes: Number(arrecadadoMes._sum.valorTotal ?? 0),
      pendenteMes: Number(pendenteMes._sum.valorTotal ?? 0),
      saldoCaixa,
      taxaInadimplencia: Math.round(taxaInadimplencia * 10) / 10,
      inadimplentesTotal,
      totalMembrosAtivos,
    },
    historico,
  })
}
