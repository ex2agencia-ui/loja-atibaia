import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ROLES_FINANCEIRO } from "@/lib/permissions"

// GET /api/financeiro/mensalidades/membro/[id]
// MEMBRO: só acessa o próprio memberId
// ADMIN/FINANCEIRO: acessam qualquer membro
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as { id?: string; role?: string; memberId?: string }
  const role = user.role ?? ""
  const { id } = await params

  // Guard: MEMBRO só acessa o próprio extrato
  const isGestor = ROLES_FINANCEIRO.includes(role as never)
  if (!isGestor) {
    if (!user.memberId || user.memberId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  const membro = await prisma.member.findUnique({
    where: { id },
    select: { id: true, nome: true, cim: true, posicao: true, situacao: true },
  })
  if (!membro) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })

  // Lazy update: PENDENTE com vencimento passado → VENCIDO
  const hoje = new Date()
  const paraVencer = await prisma.mensalidade.findMany({
    where: { memberId: id, status: "PENDENTE", vencimento: { lt: hoje } },
    select: { id: true },
  })
  if (paraVencer.length > 0) {
    await Promise.all(
      paraVencer.map((m) =>
        prisma.mensalidade.update({ where: { id: m.id }, data: { status: "VENCIDO" } }).catch(() => null)
      )
    )
  }

  // Gestor vê logs e lançamentos avulsos; membro vê só o próprio extrato limpo
  const mensalidades = await prisma.mensalidade.findMany({
    where: { memberId: id },
    orderBy: { competencia: "desc" },
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
      createdAt: true,
      updatedAt: true,
      ...(isGestor
        ? {
            logs: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true, campo: true, valorAntes: true,
                valorDepois: true, motivo: true, userId: true, createdAt: true,
              },
            },
          }
        : {}),
    },
  })

  const lancamentos = isGestor
    ? await prisma.transacaoCaixa.findMany({
        where: { memberId: id },
        orderBy: { data: "desc" },
        select: {
          id: true, tipo: true, categoria: true,
          descricao: true, valor: true, data: true,
          comprovanteUrl: true, createdAt: true,
        },
      })
    : []

  const totalPago = mensalidades
    .filter((m) => m.status === "PAGO")
    .reduce((acc, m) => acc + Number(m.valorTotal), 0)
  const totalPendente = mensalidades
    .filter((m) => ["PENDENTE", "VENCIDO"].includes(m.status))
    .reduce((acc, m) => acc + Number(m.valorTotal), 0)
  const totalInadimplente = mensalidades
    .filter((m) => m.status === "VENCIDO")
    .reduce((acc, m) => acc + Number(m.valorTotal), 0)

  return NextResponse.json({
    membro,
    mensalidades,
    lancamentos,
    totais: {
      totalCompetencias: mensalidades.length,
      pagas: mensalidades.filter((m) => m.status === "PAGO").length,
      pendentes: mensalidades.filter((m) => m.status === "PENDENTE").length,
      vencidas: mensalidades.filter((m) => m.status === "VENCIDO").length,
      isentas: mensalidades.filter((m) => m.isento).length,
      totalPago,
      totalPendente,
      totalInadimplente,
    },
  })
}
