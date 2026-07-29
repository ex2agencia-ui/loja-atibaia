import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

function safeDecryptBool(val: string | null | undefined): boolean {
  return !!val
}

export async function GET() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config) return NextResponse.json({ error: "Config não encontrada" }, { status: 404 })

  return NextResponse.json({
    // SMTP
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpUser: config.smtpUser,
    smtpPassConfigured: safeDecryptBool(config.smtpPassEncrypted),
    emailRemetente: config.emailRemetente,
    emailNomeRemetente: config.emailNomeRemetente,
    emailAtivoNotif: config.emailAtivoNotif,

    // WhatsApp
    whatsappAtivo: config.whatsappAtivo,
    whatsappProvedor: config.whatsappProvedor,

    // Evolution
    evolutionUrl: config.evolutionUrl,
    evolutionApiKeyConfigured: safeDecryptBool(config.evolutionApiKeyEncrypted),
    evolutionInstance: config.evolutionInstance,

    // Meta
    metaWabaId: config.metaWabaId,
    metaPhoneNumberId: config.metaPhoneNumberId,
    metaTokenConfigured: safeDecryptBool(config.metaTokenEncrypted),

    // Exxor
    exxorApiKeyConfigured: safeDecryptBool(config.exxorApiKeyEncrypted),
    exxorNumero: config.exxorNumero,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  const data: Record<string, unknown> = {}

  // SMTP
  if (body.smtpHost !== undefined) data.smtpHost = body.smtpHost
  if (body.smtpPort !== undefined) data.smtpPort = Number(body.smtpPort)
  if (body.smtpSecure !== undefined) data.smtpSecure = body.smtpSecure
  if (body.smtpUser !== undefined) data.smtpUser = body.smtpUser
  if (body.smtpPass) data.smtpPassEncrypted = encrypt(body.smtpPass)
  if (body.emailRemetente !== undefined) data.emailRemetente = body.emailRemetente
  if (body.emailNomeRemetente !== undefined) data.emailNomeRemetente = body.emailNomeRemetente
  if (body.emailAtivoNotif !== undefined) data.emailAtivoNotif = body.emailAtivoNotif

  // WhatsApp
  if (body.whatsappAtivo !== undefined) data.whatsappAtivo = body.whatsappAtivo
  if (body.whatsappProvedor !== undefined) data.whatsappProvedor = body.whatsappProvedor

  // Evolution
  if (body.evolutionUrl !== undefined) data.evolutionUrl = body.evolutionUrl
  if (body.evolutionApiKey) data.evolutionApiKeyEncrypted = encrypt(body.evolutionApiKey)
  if (body.evolutionInstance !== undefined) data.evolutionInstance = body.evolutionInstance

  // Meta
  if (body.metaWabaId !== undefined) data.metaWabaId = body.metaWabaId
  if (body.metaPhoneNumberId !== undefined) data.metaPhoneNumberId = body.metaPhoneNumberId
  if (body.metaToken) data.metaTokenEncrypted = encrypt(body.metaToken)

  // Exxor
  if (body.exxorApiKey) data.exxorApiKeyEncrypted = encrypt(body.exxorApiKey)
  if (body.exxorNumero !== undefined) data.exxorNumero = body.exxorNumero

  const updated = await prisma.configLoja.update({
    where: { id: "singleton" },
    data,
  })

  return NextResponse.json({ ok: true })
}

// Testar SMTP
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const acao = body.acao ?? "smtp"

  if (acao === "smtp") {
    const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
    if (!config?.smtpHost || !config.smtpUser || !config.smtpPassEncrypted) {
      return NextResponse.json({ ok: false, error: "SMTP não configurado" })
    }
    try {
      const nodemailer = (await import("nodemailer")).default
      const pass = decrypt(config.smtpPassEncrypted)
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort ?? 587,
        secure: config.smtpSecure,
        auth: { user: config.smtpUser, pass },
      })
      await transporter.verify()
      return NextResponse.json({ ok: true, message: "Conexão SMTP verificada com sucesso" })
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) })
    }
  }

  return NextResponse.json({ ok: false, error: "Ação desconhecida" })
}
