import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

type Params = { params: Promise<{ id: string }> }

// PUT /api/financeiro/mensalidades/[id]
// Ações: baixa, acordo, isencao, editar valor
// Body: { acao: "baixa" | "acordo" | "isencao" | "editar", ...campos, motivo }
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { id } = await params
  const body = await req.json()
  const { acao, motivo } = body
  const userId = session.user?.id ?? "sistema"

  const atual = await prisma.mensalidade.findUnique({ where: { id } })
  if (!atual) return NextResponse.json({ error: "Mensalidade não encontrada" }, { status: 404 })

  const logs: { campo: string; valorAntes: string; valorDepois: string; motivo?: string; userId: string }[] = []

  const registrarLog = (campo: string, antes: unknown, depois: unknown) => {
    const antesStr = String(antes ?? "")
    const depoisStr = String(depois ?? "")
    if (antesStr !== depoisStr) {
      logs.push({ campo, valorAntes: antesStr, valorDepois: depoisStr, motivo, userId })
    }
  }

  let dados: Record<string, unknown> = {}

  if (acao === "baixa") {
    // Dar baixa manual — marca como PAGO
    const pagamento = body.pagamento ? new Date(body.pagamento) : new Date()
    registrarLog("status", atual.status, "PAGO")
    registrarLog("pagamento", atual.pagamento, pagamento.toISOString())
    dados = { status: "PAGO", pagamento }

  } else if (acao === "acordo") {
    // Negociação: novo valor + nova data de vencimento
    const novoValor = Number(body.valor)
    const desconto = Number(atual.valor) - novoValor
    const novoVencimento = body.vencimento ? new Date(body.vencimento) : atual.vencimento
    registrarLog("valor", atual.valor, novoValor)
    registrarLog("valorTotal", atual.valorTotal, novoValor)
    registrarLog("desconto", atual.desconto, desconto > 0 ? desconto : 0)
    registrarLog("vencimento", atual.vencimento.toISOString(), novoVencimento.toISOString())
    registrarLog("status", atual.status, "PENDENTE")
    dados = {
      valor: novoValor,
      valorTotal: novoValor,
      desconto: desconto > 0 ? desconto : 0,
      vencimento: novoVencimento,
      status: "PENDENTE",
      observacao: body.observacao ?? atual.observacao,
    }

  } else if (acao === "isencao") {
    // Isentar — cancela a cobrança
    registrarLog("status", atual.status, "CANCELADO")
    registrarLog("isento", atual.isento, true)
    dados = { status: "CANCELADO", isento: true, observacao: body.observacao ?? motivo ?? atual.observacao }

  } else if (acao === "editar") {
    // Edição livre de campos
    const campos = ["valor", "valorTotal", "desconto", "jurosMulta", "vencimento", "observacao", "status"]
    for (const campo of campos) {
      if (body[campo] !== undefined) {
        registrarLog(campo, (atual as Record<string, unknown>)[campo], body[campo])
        dados[campo] = campo === "vencimento" ? new Date(body[campo]) : body[campo]
      }
    }

  } else if (acao === "reabrir") {
    // Desfaz isenção / volta para PENDENTE
    registrarLog("status", atual.status, "PENDENTE")
    registrarLog("isento", atual.isento, false)
    dados = { status: "PENDENTE", isento: false }

  } else {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  }

  // Atualiza a mensalidade
  const atualizada = await prisma.mensalidade.update({ where: { id }, data: dados })

  // Insere logs (individualmente — Neon HTTP não suporta createMany)
  await Promise.all(
    logs.map((log) =>
      prisma.mensalidadeLog.create({
        data: {
          mensalidadeId: id,
          campo: log.campo,
          valorAntes: log.valorAntes,
          valorDepois: log.valorDepois,
          motivo: log.motivo,
          userId: log.userId,
        },
      }).catch(() => null)
    )
  )

  return NextResponse.json(atualizada)
}

// GET /api/financeiro/mensalidades/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const { id } = await params

  const mensalidade = await prisma.mensalidade.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "desc" } },
      member: { select: { id: true, nome: true, cim: true } },
    },
  })
  if (!mensalidade) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  return NextResponse.json(mensalidade)
}
