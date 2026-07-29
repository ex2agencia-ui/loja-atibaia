import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_FINANCEIRO } from "@/lib/permissions"
import { encrypt, decrypt } from "@/lib/crypto"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })

  if (!config) return NextResponse.json(null)

  // Nunca retorna a senha — só indica se está configurada
  const { smtpPassEncrypted, ...rest } = config
  return NextResponse.json({
    ...rest,
    smtpPassConfigured: !!smtpPassEncrypted,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const body = await req.json()

  // Campos permitidos para atualização
  const {
    nome,
    mensalidadeValorPadrao,
    mensalidadeDiaVencimento,
    pixChave,
    pixTipo,
    pixBeneficiario,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass, // senha em plaintext — só presente se o usuário digitou uma nova
    emailRemetente,
    emailNomeRemetente,
    cnpj,
    email,
    telefone,
    endereco,
  } = body

  // Buscar config atual para preservar senha se não foi enviada nova
  const current = await prisma.configLoja.findUnique({ where: { id: "singleton" } })

  let smtpPassEncrypted = current?.smtpPassEncrypted ?? null
  if (smtpPass && typeof smtpPass === "string" && smtpPass.length > 0) {
    smtpPassEncrypted = encrypt(smtpPass)
  }

  const data = {
    ...(nome !== undefined && { nome }),
    ...(mensalidadeValorPadrao !== undefined && { mensalidadeValorPadrao }),
    ...(mensalidadeDiaVencimento !== undefined && { mensalidadeDiaVencimento }),
    ...(pixChave !== undefined && { pixChave }),
    ...(pixTipo !== undefined && { pixTipo }),
    ...(pixBeneficiario !== undefined && { pixBeneficiario }),
    ...(smtpHost !== undefined && { smtpHost }),
    ...(smtpPort !== undefined && { smtpPort: Number(smtpPort) }),
    ...(smtpSecure !== undefined && { smtpSecure: Boolean(smtpSecure) }),
    ...(smtpUser !== undefined && { smtpUser }),
    smtpPassEncrypted,
    ...(emailRemetente !== undefined && { emailRemetente }),
    ...(emailNomeRemetente !== undefined && { emailNomeRemetente }),
    ...(cnpj !== undefined && { cnpj }),
    ...(email !== undefined && { email }),
    ...(telefone !== undefined && { telefone }),
    ...(endereco !== undefined && { endereco }),
  }

  const config = await prisma.configLoja.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })

  const { smtpPassEncrypted: _, ...rest } = config
  return NextResponse.json({ ...rest, smtpPassConfigured: !!config.smtpPassEncrypted })
}

// Endpoint auxiliar para testar SMTP (apenas verifica se consegue conectar)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_FINANCEIRO)
  if (err) return err

  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config?.smtpHost || !config.smtpPassEncrypted) {
    return NextResponse.json({ error: "SMTP não configurado" }, { status: 400 })
  }

  try {
    const nodemailer = await import("nodemailer")
    const pass = decrypt(config.smtpPassEncrypted)
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort ?? 587,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser ?? "", pass },
    })
    await transporter.verify()
    return NextResponse.json({ ok: true, message: "Conexão SMTP verificada com sucesso" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido"
    return NextResponse.json({ error: `Falha na conexão SMTP: ${msg}` }, { status: 400 })
  }
}
