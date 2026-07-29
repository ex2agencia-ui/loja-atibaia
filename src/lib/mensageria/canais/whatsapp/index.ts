import { prisma } from "@/lib/prisma"
import { createEvolutionAdapter } from "./evolution"
import { createMetaAdapter } from "./meta"
import { createExxorAdapter } from "./exxor"
import type { WhatsAppPayload, WhatsAppResult } from "./types"

export async function enviarWhatsApp(payload: WhatsAppPayload): Promise<WhatsAppResult> {
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config?.whatsappAtivo) {
    return { ok: false, erro: "WhatsApp não habilitado" }
  }

  const provedor = config.whatsappProvedor

  if (provedor === "EVOLUTION") {
    if (!config.evolutionUrl || !config.evolutionApiKeyEncrypted || !config.evolutionInstance) {
      return { ok: false, erro: "Evolution API não configurado" }
    }
    const adapter = createEvolutionAdapter({
      url: config.evolutionUrl,
      apiKeyEncrypted: config.evolutionApiKeyEncrypted,
      instance: config.evolutionInstance,
    })
    return adapter.enviar(payload)
  }

  if (provedor === "META") {
    if (!config.metaWabaId || !config.metaPhoneNumberId || !config.metaTokenEncrypted) {
      return { ok: false, erro: "Meta Cloud API não configurado" }
    }
    const adapter = createMetaAdapter({
      wabaId: config.metaWabaId,
      phoneNumberId: config.metaPhoneNumberId,
      tokenEncrypted: config.metaTokenEncrypted,
    })
    return adapter.enviar(payload)
  }

  if (provedor === "EXXOR") {
    if (!config.exxorApiKeyEncrypted || !config.exxorNumero) {
      return { ok: false, erro: "Exxor não configurado" }
    }
    const adapter = createExxorAdapter({
      apiKeyEncrypted: config.exxorApiKeyEncrypted,
      numero: config.exxorNumero,
    })
    return adapter.enviar(payload)
  }

  return { ok: false, erro: "Provedor desconhecido" }
}
