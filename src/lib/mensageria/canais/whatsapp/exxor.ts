import type { WhatsAppAdapter, WhatsAppPayload, WhatsAppResult } from "./types"

interface ExxorConfig {
  apiKeyEncrypted: string
  numero: string
}

export function createExxorAdapter(config: ExxorConfig): WhatsAppAdapter {
  return {
    async enviar(payload: WhatsAppPayload): Promise<WhatsAppResult> {
      // MOCK — integração real pendente
      console.log(`[Exxor MOCK] → ${payload.telefone}: ${payload.mensagem.substring(0, 50)}...`)
      return { ok: true, messageId: `exxor-mock-${Date.now()}` }

      // Implementação real (descomentar quando documentação Exxor disponível):
      // const apiKey = decrypt(config.apiKeyEncrypted)
      // const res = await fetch("https://api.exxor.com.br/v1/send", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      //   body: JSON.stringify({ from: config.numero, to: payload.telefone, message: payload.mensagem }),
      // })
      // const data = await res.json()
      // if (!res.ok) return { ok: false, erro: data.error ?? "Erro Exxor" }
      // return { ok: true, messageId: data.id }
    },
  }
}
