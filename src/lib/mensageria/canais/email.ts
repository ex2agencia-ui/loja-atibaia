import nodemailer from "nodemailer"
import { decrypt } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"

export interface EmailPayload {
  para: string
  assunto: string
  html: string
}

export async function enviarEmail(payload: EmailPayload): Promise<{ ok: boolean; erro?: string }> {
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config?.smtpHost || !config.smtpUser || !config.smtpPassEncrypted) {
    return { ok: false, erro: "SMTP não configurado" }
  }

  let pass: string
  try {
    pass = decrypt(config.smtpPassEncrypted)
  } catch {
    return { ok: false, erro: "Falha ao descriptografar senha SMTP" }
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass },
  })

  try {
    await transporter.sendMail({
      from: `"${config.emailNomeRemetente ?? config.nome}" <${config.emailRemetente ?? config.smtpUser}>`,
      to: payload.para,
      subject: payload.assunto,
      html: payload.html,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: String(e) }
  }
}
