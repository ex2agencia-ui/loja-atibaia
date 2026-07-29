import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

// GET /api/financeiro/caixa?tipo=RECEITA&categoria=MENSALIDADE&de=2026-01-01&ate=2026-12-31&busca=
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get("tipo")
  const categoria = searchParams.get("categoria")
  const busca = searchParams.get("busca") ?? ""
  const de = searchParams.get("de")
  const ate = searchParams.get("ate")

  const where = {
    ...(tipo && { tipo: tipo as never }),
    ...(categoria && { categoria: categoria as never }),
    ...(busca && {
      descricao: { contains: busca, mode: "insensitive" as const },
    }),
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
    orderBy: { data: "desc" },
    select: {
      id: true,
      tipo: true,
      categoria: true,
      descricao: true,
      valor: true,
      data: true,
      comprovanteUrl: true,
      registradoPorId: true,
      createdAt: true,
      member: {
        select: { id: true, nome: true, cim: true },
      },
    },
  })

  // Totalizadores do período filtrado
  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA")
    .reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((acc, l) => acc + Number(l.valor), 0)

  return NextResponse.json({
    lancamentos,
    totais: {
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo: totalReceitas - totalDespesas,
      total: lancamentos.length,
    },
  })
}

// POST /api/financeiro/caixa
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const body = await req.json()
  const { tipo, categoria, descricao, valor, data, memberId, comprovanteUrl } = body

  if (!tipo || !categoria || !descricao || !valor) {
    return NextResponse.json(
      { error: "Campos obrigatórios: tipo, categoria, descricao, valor" },
      { status: 400 }
    )
  }

  const lancamento = await prisma.transacaoCaixa.create({
    data: {
      tipo,
      categoria,
      descricao,
      valor: Number(valor),
      data: data ? new Date(data) : new Date(),
      memberId: memberId || null,
      registradoPorId: session.user?.id ?? "sistema",
      comprovanteUrl: comprovanteUrl || null,
    },
  })

  const member = memberId
    ? await prisma.member.findUnique({ where: { id: memberId }, select: { id: true, nome: true, cim: true } })
    : null

  return NextResponse.json({ ...lancamento, member }, { status: 201 })
}
