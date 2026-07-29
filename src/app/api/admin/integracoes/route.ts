import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { encrypt, decrypt } from "@/lib/crypto"

const ENCRYPTED_FIELDS = [
  "asaasApiKeyEncrypted",
  "mercadoPagoTokenEncrypted",
  "stripeSecretKeyEncrypted",
  "coraClientSecretEncrypted",
  "c6CertificateEncrypted",
] as const

type EncryptedField = typeof ENCRYPTED_FIELDS[number]

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as { role?: string }
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config) return NextResponse.json({
    gatewayAtivo: "MANUAL",
    gatewaySandbox: true,
    asaasConfigured: false,
    mercadoPagoConfigured: false,
    stripeConfigured: false,
    coraConfigured: false,
    c6Configured: false,
    stripeWebhookSecret: null,
    coraClientId: null,
    c6ClientId: null,
    c6CertificatePass: null,
  })

  // Nunca retorna os campos criptografados — só indica se estão configurados
  return NextResponse.json({
    gatewayAtivo: config.gatewayAtivo,
    gatewaySandbox: config.gatewaySandbox,
    asaasConfigured: !!config.asaasApiKeyEncrypted,
    mercadoPagoConfigured: !!config.mercadoPagoTokenEncrypted,
    stripeConfigured: !!config.stripeSecretKeyEncrypted,
    coraConfigured: !!(config.coraClientId && config.coraClientSecretEncrypted),
    c6Configured: !!(config.c6ClientId && config.c6CertificateEncrypted),
    stripeWebhookSecret: config.stripeWebhookSecret ?? null,
    coraClientId: config.coraClientId ?? null,
    c6ClientId: config.c6ClientId ?? null,
    c6CertificatePass: config.c6CertificatePass ?? null,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as { role?: string }
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const body = await req.json()
  const {
    gatewayAtivo,
    gatewaySandbox,
    // Asaas
    asaasApiKey,
    // Mercado Pago
    mercadoPagoToken,
    // Stripe
    stripeSecretKey,
    stripeWebhookSecret,
    // Cora
    coraClientId,
    coraClientSecret,
    // C6 Bank
    c6ClientId,
    c6Certificate, // base64 do .p12
    c6CertificatePass,
  } = body

  const current = await prisma.configLoja.findUnique({ where: { id: "singleton" } })

  // Criptografa cada credencial se uma nova foi enviada; preserva a existente caso contrário
  function encryptIfProvided(newVal: string | undefined, existing: string | null | undefined): string | null | undefined {
    if (newVal && newVal.trim().length > 0) return encrypt(newVal.trim())
    return existing ?? null
  }

  const data: Record<string, unknown> = {}

  if (gatewayAtivo !== undefined) data.gatewayAtivo = gatewayAtivo
  if (gatewaySandbox !== undefined) data.gatewaySandbox = Boolean(gatewaySandbox)

  data.asaasApiKeyEncrypted = encryptIfProvided(asaasApiKey, current?.asaasApiKeyEncrypted)
  data.mercadoPagoTokenEncrypted = encryptIfProvided(mercadoPagoToken, current?.mercadoPagoTokenEncrypted)
  data.stripeSecretKeyEncrypted = encryptIfProvided(stripeSecretKey, current?.stripeSecretKeyEncrypted)
  data.coraClientSecretEncrypted = encryptIfProvided(coraClientSecret, current?.coraClientSecretEncrypted)
  data.c6CertificateEncrypted = encryptIfProvided(c6Certificate, current?.c6CertificateEncrypted)

  if (stripeWebhookSecret !== undefined) data.stripeWebhookSecret = stripeWebhookSecret || null
  if (coraClientId !== undefined) data.coraClientId = coraClientId || null
  if (c6ClientId !== undefined) data.c6ClientId = c6ClientId || null
  if (c6CertificatePass !== undefined) data.c6CertificatePass = c6CertificatePass || null

  await prisma.configLoja.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })

  return NextResponse.json({ ok: true })
}

// POST /api/admin/integracoes — testa a conexão com o gateway configurado
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as { role?: string }
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { gateway } = await req.json()
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })

  if (!config) return NextResponse.json({ error: "Nenhuma configuração salva" }, { status: 422 })

  try {
    if (gateway === "ASAAS") {
      if (!config.asaasApiKeyEncrypted) throw new Error("API Key não configurada")
      const apiKey = decrypt(config.asaasApiKeyEncrypted)
      const baseUrl = config.gatewaySandbox
        ? "https://sandbox.asaas.com/api/v3"
        : "https://api.asaas.com/api/v3"
      const res = await fetch(`${baseUrl}/myAccount`, {
        headers: { access_token: apiKey },
      })
      if (!res.ok) throw new Error(`Asaas retornou ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ ok: true, info: `Conta: ${data.name ?? data.email ?? "OK"}` })
    }

    if (gateway === "MERCADO_PAGO") {
      if (!config.mercadoPagoTokenEncrypted) throw new Error("Token não configurado")
      const token = decrypt(config.mercadoPagoTokenEncrypted)
      const res = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Mercado Pago retornou ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ ok: true, info: `Conta: ${data.email ?? "OK"}` })
    }

    if (gateway === "STRIPE") {
      if (!config.stripeSecretKeyEncrypted) throw new Error("Secret Key não configurada")
      const sk = decrypt(config.stripeSecretKeyEncrypted)
      const res = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${sk}` },
      })
      if (!res.ok) throw new Error(`Stripe retornou ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ ok: true, info: `Conta: ${data.email ?? data.id ?? "OK"}` })
    }

    return NextResponse.json({ error: `Teste não implementado para ${gateway}` }, { status: 422 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 422 }
    )
  }
}
