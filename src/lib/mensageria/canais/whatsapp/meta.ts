import type { WhatsAppAdapter, WhatsAppPayload, WhatsAppResult } from "./types"

interface MetaConfig {
  wabaId: string
  phoneNumberId: string
  tokenEncrypted: string
}

export function createMetaAdapter(config: MetaConfig): WhatsAppAdapter {
  return {
    async enviar(payload: WhatsAppPayload): Promise<WhatsAppResult> {
      // MOCK — integração real pendente
      console.log(`[Meta WA MOCK] → ${payload.telefone}: ${payload.mensagem.substring(0, 50)}...`)
      return { ok: true, messageId: `meta-mock-${Date.now()}` }

      // Implementação real (descomentar quando aprovado pela Meta):
      // const token = decrypt(config.tokenEncrypted)
      // const res = await fetch(
      //   `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      //     body: JSON.stringify({
      //       messaging_product: "whatsapp",
      //       to: payload.telefone,
      //       type: "text",
      //       text: { body: payload.mensagem },
      //     }),
      //   }
      // )
      // const data = await res.json()
      // if (!res.ok) return { ok: false, erro: data.error?.message ?? "Erro Meta" }
      // return { ok: true, messageId: data.messages?.[0]?.id }
    },
  }
}
