export interface WhatsAppPayload {
  telefone: string  // formato internacional: 5511999999999
  mensagem: string
}

export interface WhatsAppResult {
  ok: boolean
  erro?: string
  messageId?: string
}

export interface WhatsAppAdapter {
  enviar(payload: WhatsAppPayload): Promise<WhatsAppResult>
}
