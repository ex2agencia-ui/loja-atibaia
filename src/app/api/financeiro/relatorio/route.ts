import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

const CATEGORIA_LABEL: Record<string, string> = {
  MENSALIDADE:          "Mensalidade",
  TRONCO_SOLIDARIEDADE: "Tronco de Solidariedade",
  TAXA_GRAU:            "Taxa de Grau",
  DOACAO:               "Doação",
  MANUTENCAO_TEMPLO:    "Manutenção do Templo",
  AGAPE:                "Ágape",
  REPASSE_POTENCIA:     "Repasse à Potência",
  OUTROS:               "Outros",
}

// GET /api/financeiro/relatorio?de=2026-01-01&ate=2026-12-31&formato=csv
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { searchParams } = new URL(req.url)
  const de = searchParams.get("de")
  const ate = searchParams.get("ate")
  const formato = searchParams.get("formato") // "csv" ou undefined (json)

  const where = {
    ...(de || ate
      ? {
          data: {
            ...(de && { gte: new Date(de) }),
            ...(ate && { lte: new Date(ate + "T23:59:59") }),
          },
        }
      : {}),
  }

  const lancamentos = await prisma.transacaoCaixa.findMany({
    where,
    orderBy: { data: "asc" },
    select: {
      id: true,
      tipo: true,
      categoria: true,
      descricao: true,
      valor: true,
      data: true,
      comprovanteUrl: true,
      member: { select: { nome: true, cim: true } },
    },
  })

  // Balancete por categoria
  const balancete = new Map<string, { receitas: number; despesas: number }>()
  for (const l of lancamentos) {
    const entry = balancete.get(l.categoria) ?? { receitas: 0, despesas: 0 }
    if (l.tipo === "RECEITA") entry.receitas += Number(l.valor)
    else entry.despesas += Number(l.valor)
    balancete.set(l.categoria, entry)
  }

  const linhasBalancete = Array.from(balancete.entries()).map(([cat, v]) => ({
    categoria: cat,
    categoriaLabel: CATEGORIA_LABEL[cat] ?? cat,
    receitas: v.receitas,
    despesas: v.despesas,
    saldo: v.receitas - v.despesas,
  })).sort((a, b) => b.receitas - a.receitas)

  const totalReceitas = linhasBalancete.reduce((acc, l) => acc + l.receitas, 0)
  const totalDespesas = linhasBalancete.reduce((acc, l) => acc + l.despesas, 0)

  if (formato === "csv") {
    const rows = [
      ["Data", "Tipo", "Categoria", "Descrição", "Membro", "CIM", "Valor"],
      ...lancamentos.map((l) => [
        new Date(l.data).toLocaleDateString("pt-BR"),
        l.tipo,
        CATEGORIA_LABEL[l.categoria] ?? l.categoria,
        `"${l.descricao.replace(/"/g, '""')}"`,
        l.member?.nome ?? "",
        l.member?.cim ?? "",
        Number(l.valor).toFixed(2),
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const deStr = de?.slice(0, 7).replace("-", "-") ?? "inicio"
    const ateStr = ate?.slice(0, 7) ?? "fim"
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="balancete-${deStr}-${ateStr}.csv"`,
      },
    })
  }

  return NextResponse.json({
    balancete: linhasBalancete,
    totais: { receitas: totalReceitas, despesas: totalDespesas, saldo: totalReceitas - totalDespesas },
    lancamentos,
    periodo: { de, ate },
  })
}
