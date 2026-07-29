import { decrypt } from "@/lib/crypto"
import type { WhatsAppAdapter, WhatsAppPayload, WhatsAppResult } from "./types"

interface EvolutionConfig {
  url: string
  apiKeyEncrypted: string
  instance: string
}

export function createEvolutionAdapter(config: EvolutionConfig): WhatsAppAdapter {
  return {
    async enviar(payload: WhatsAppPayload): Promise<WhatsAppResult> {
      // MOCK — integração real pendente
      console.log(`[Evolution MOCK] → ${payload.telefone}: ${payload.mensagem.substring(0, 50)}...`)
      return { ok: true, messageId: `evolution-mock-${Date.now()}` }

      // Implementação real (descomentar quando Evolution estiver configurado):
      // const apiKey = decrypt(config.apiKeyEncrypted)
      // const res = await fetch(`${config.url}/message/sendText/${config.instance}`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", "apikey": apiKey },
      //   body: JSON.stringify({ number: payload.telefone, text: payload.mensagem }),
      // })
      // const data = await res.json()
      // if (!res.ok) return { ok: false, erro: data.message ?? "Erro Evolution" }
      // return { ok: true, messageId: data.key?.id }
    },
  }
}
