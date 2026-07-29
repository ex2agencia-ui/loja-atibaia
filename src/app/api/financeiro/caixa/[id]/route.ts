import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO, ROLES_USUARIOS } from "@/lib/permissions"

type Params = { params: Promise<{ id: string }> }

// DELETE /api/financeiro/caixa/[id] — apenas ADMIN
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS) // ADMIN only
  if (err) return err

  const { id } = await params

  const lancamento = await prisma.transacaoCaixa.findUnique({ where: { id } })
  if (!lancamento) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 })

  await prisma.transacaoCaixa.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// GET /api/financeiro/caixa/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { id } = await params

  const lancamento = await prisma.transacaoCaixa.findUnique({
    where: { id },
    include: { member: { select: { id: true, nome: true, cim: true } } },
  })
  if (!lancamento) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  return NextResponse.json(lancamento)
}
