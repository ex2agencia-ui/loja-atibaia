import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ROLES_FINANCEIRO } from "@/lib/permissions"

// GET /api/financeiro/mensalidades/visao-geral
// Retorna todos os membros ativos com resumo financeiro e mensalidades vencidas
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as { role?: string }
  if (!ROLES_FINANCEIRO.includes(user.role as never)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const membros = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    orderBy: [{ nome: "asc" }],
    select: {
      id: true,
      nome: true,
      cim: true,
      posicao: true,
      email: true,
      mensalidades: {
        where: { status: { in: ["PENDENTE", "VENCIDO"] } },
        select: {
          id: true,
          competencia: true,
          status: true,
          isento: true,
          valorTotal: true,
          vencimento: true,
          pagamento: true,
        },
        orderBy: { competencia: "asc" },
      },
    },
  })

  // Lazy update PENDENTE → VENCIDO
  const agora = new Date()
  const paraAtualizar = membros.flatMap(m =>
    m.mensalidades
      .filter(ms => ms.status === "PENDENTE" && new Date(ms.vencimento) < agora)
      .map(ms => ms.id)
  )
  if (paraAtualizar.length > 0) {
    await Promise.all(
      paraAtualizar.map(id =>
        prisma.mensalidade.update({ where: { id }, data: { status: "VENCIDO" } }).catch(() => null)
      )
    )
    // Reflete sem re-query
    for (const m of membros) {
      for (const ms of m.mensalidades) {
        if (paraAtualizar.includes(ms.id)) ms.status = "VENCIDO"
      }
    }
  }

  const resultado = membros.map(m => {
    const vencidas = m.mensalidades.filter(ms => ms.status === "VENCIDO")
    const pendentes = m.mensalidades.filter(ms => ms.status === "PENDENTE")
    const totalAberto = vencidas.reduce((acc, ms) => acc + Number(ms.valorTotal), 0)

    return {
      id: m.id,
      nome: m.nome,
      cim: m.cim,
      posicao: m.posicao,
      email: m.email ?? null,
      vencidas: vencidas.length,
      pendentes: pendentes.length,
      totalAberto,
      mensalidadesVencidas: vencidas.map(ms => ({
        id: ms.id,
        competencia: ms.competencia,
        status: ms.status,
        isento: ms.isento,
        valorTotal: Number(ms.valorTotal),
        vencimento: ms.vencimento.toISOString(),
        pagamento: ms.pagamento ? ms.pagamento.toISOString() : null,
      })),
    }
  })

  return NextResponse.json({ membros: resultado, total: resultado.length })
}
