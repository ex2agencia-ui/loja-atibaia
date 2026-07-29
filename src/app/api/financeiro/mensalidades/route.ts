import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

// GET /api/financeiro/mensalidades?competencia=2026-07&status=PENDENTE
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { searchParams } = new URL(req.url)
  const competencia = searchParams.get("competencia") // "YYYY-MM"
  const status = searchParams.get("status")

  // Busca todos os membros ativos
  const membros = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    select: {
      id: true,
      nome: true,
      cim: true,
      posicao: true,
      mensalidades: competencia
        ? {
            where: {
              competencia,
              ...(status ? { status: status as never } : {}),
            },
            select: {
              id: true,
              competencia: true,
              valor: true,
              desconto: true,
              jurosMulta: true,
              valorTotal: true,
              vencimento: true,
              pagamento: true,
              status: true,
              isento: true,
              observacao: true,
              gateway: true,
            },
          }
        : { take: 0 },
    },
    orderBy: { nome: "asc" },
  })

  // Se competencia informada, retorna membro com mensalidade (ou null se não gerada)
  const resultado = membros.map((m) => ({
    id: m.id,
    nome: m.nome,
    cim: m.cim,
    posicao: m.posicao,
    mensalidade: m.mensalidades[0] ?? null,
  }))

  // Totalizadores
  const comMensalidade = resultado.filter((r) => r.mensalidade)
  const totalPago = comMensalidade
    .filter((r) => r.mensalidade?.status === "PAGO")
    .reduce((acc, r) => acc + Number(r.mensalidade!.valorTotal), 0)
  const totalPendente = comMensalidade
    .filter((r) => ["PENDENTE", "VENCIDO"].includes(r.mensalidade?.status ?? ""))
    .reduce((acc, r) => acc + Number(r.mensalidade!.valorTotal), 0)

  return NextResponse.json({
    membros: resultado,
    totais: {
      total: resultado.length,
      comMensalidade: comMensalidade.length,
      semMensalidade: resultado.length - comMensalidade.length,
      pagos: comMensalidade.filter((r) => r.mensalidade?.status === "PAGO").length,
      pendentes: comMensalidade.filter((r) => r.mensalidade?.status === "PENDENTE").length,
      vencidos: comMensalidade.filter((r) => r.mensalidade?.status === "VENCIDO").length,
      isentos: comMensalidade.filter((r) => r.mensalidade?.status === "CANCELADO" || r.mensalidade?.isento).length,
      totalPago,
      totalPendente,
    },
  })
}
