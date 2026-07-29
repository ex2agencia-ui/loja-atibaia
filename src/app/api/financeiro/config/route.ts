import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"

// Expõe apenas os dados financeiros necessários para o módulo (sem dados SMTP)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const config = await prisma.configLoja.findUnique({
    where: { id: "singleton" },
    select: {
      nome: true,
      mensalidadeValorPadrao: true,
      mensalidadeDiaVencimento: true,
      pixChave: true,
      pixTipo: true,
      pixBeneficiario: true,
      cnpj: true,
      email: true,
      telefone: true,
      endereco: true,
    },
  })

  return NextResponse.json(config ?? {
    nome: "Loja Maçônica",
    mensalidadeValorPadrao: 0,
    mensalidadeDiaVencimento: 10,
    pixChave: null,
    pixTipo: null,
    pixBeneficiario: null,
    cnpj: null,
    email: null,
    telefone: null,
    endereco: null,
  })
}
