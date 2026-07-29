import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

// POST /api/financeiro/mensalidades/gerar-lote
// Body: { competencia: "2026-07" }
// Gera mensalidades para todos os membros ativos que ainda não têm registro na competência
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { competencia } = await req.json()
  if (!competencia || !/^\d{4}-\d{2}$/.test(competencia)) {
    return NextResponse.json({ error: "Competência inválida. Use o formato YYYY-MM." }, { status: 400 })
  }

  // Busca config para valor padrão e dia de vencimento
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  const valorPadrao = Number(config?.mensalidadeValorPadrao ?? 0)
  const diaVencimento = config?.mensalidadeDiaVencimento ?? 10

  if (valorPadrao <= 0) {
    return NextResponse.json(
      { error: "Configure o valor padrão da mensalidade em Configurações antes de gerar o lote." },
      { status: 400 }
    )
  }

  // Calcula data de vencimento
  const [ano, mes] = competencia.split("-").map(Number)
  const vencimento = new Date(ano, mes - 1, diaVencimento, 12, 0, 0)

  // Membros ativos
  const membros = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    select: { id: true },
  })

  // Busca quais já têm mensalidade nesta competência
  const existentes = await prisma.mensalidade.findMany({
    where: { competencia },
    select: { memberId: true },
  })
  const existentesIds = new Set(existentes.map((e) => e.memberId))

  const paraGerar = membros.filter((m) => !existentesIds.has(m.id))

  if (paraGerar.length === 0) {
    return NextResponse.json({
      message: "Todos os membros ativos já possuem mensalidade para esta competência.",
      gerados: 0,
      ignorados: membros.length,
    })
  }

  // Neon HTTP não suporta createMany — cria individualmente em paralelo
  const resultados = await Promise.all(
    paraGerar.map((m) =>
      prisma.mensalidade.create({
        data: {
          memberId: m.id,
          competencia,
          valor: valorPadrao,
          valorTotal: valorPadrao,
          vencimento,
          status: "PENDENTE",
          registradoPorId: session.user?.id,
        },
      }).catch(() => null)
    )
  )

  const gerados = resultados.filter(Boolean).length
  const falhas = resultados.filter((r) => r === null).length

  return NextResponse.json({
    message: `Lote gerado: ${gerados} mensalidades criadas para ${competencia}.`,
    gerados,
    ignorados: existentesIds.size,
    falhas,
    competencia,
    valorPadrao,
    vencimento,
  })
}
