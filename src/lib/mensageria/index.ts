import { prisma } from "@/lib/prisma"
import { enviarEmail } from "./canais/email"
import { enviarWhatsApp } from "./canais/whatsapp"
import type {
  NotificacaoCanal,
  NotificacaoEvento,
} from "@/generated/prisma"

export interface NotificarPayload {
  evento: NotificacaoEvento
  memberId?: string
  destinatario?: {
    email?: string
    telefone?: string
    nome?: string
  }
  assunto: string
  html: string        // para email
  texto: string       // para whatsapp (plain text)
  canais?: NotificacaoCanal[]  // se omitido, usa preferências do membro
}

export async function notificar(payload: NotificarPayload): Promise<void> {
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config) return

  const canaisAtivos: NotificacaoCanal[] = payload.canais ?? await resolverCanais(payload.memberId, payload.evento)

  for (const canal of canaisAtivos) {
    let status: "ENVIADO" | "ERRO" | "IGNORADO" = "IGNORADO"
    let erro: string | undefined

    if (canal === "EMAIL" && config.emailAtivoNotif && payload.destinatario?.email) {
      const res = await enviarEmail({
        para: payload.destinatario.email,
        assunto: payload.assunto,
        html: payload.html,
      })
      status = res.ok ? "ENVIADO" : "ERRO"
      erro = res.erro
    }

    if (canal === "WHATSAPP" && config.whatsappAtivo && payload.destinatario?.telefone) {
      const res = await enviarWhatsApp({
        telefone: payload.destinatario.telefone,
        mensagem: payload.texto,
      })
      status = res.ok ? "ENVIADO" : "ERRO"
      erro = res.erro
    }

    await prisma.notificacaoLog.create({
      data: {
        canal,
        evento: payload.evento,
        status,
        memberId: payload.memberId ?? null,
        destinatario: canal === "EMAIL" ? payload.destinatario?.email : payload.destinatario?.telefone,
        assunto: payload.assunto,
        erro: erro ?? null,
      },
    })
  }
}

async function resolverCanais(memberId: string | undefined, evento: NotificacaoEvento): Promise<NotificacaoCanal[]> {
  if (!memberId) return ["EMAIL"]

  const prefs = await prisma.notificacaoPreferencia.findMany({
    where: { memberId, evento, ativo: true },
  })

  if (prefs.length === 0) return ["EMAIL" as NotificacaoCanal]
  return prefs.map(p => p.canal as NotificacaoCanal)
}
