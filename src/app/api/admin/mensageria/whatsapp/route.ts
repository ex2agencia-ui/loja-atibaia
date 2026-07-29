import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

async function getEvolutionConfig() {
  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })
  if (!config?.evolutionUrl || !config.evolutionApiKeyEncrypted || !config.evolutionInstance) {
    return null
  }
  return {
    url: config.evolutionUrl,
    apiKey: decrypt(config.evolutionApiKeyEncrypted),
    instance: config.evolutionInstance,
  }
}

// GET /api/admin/mensageria/whatsapp?acao=status|qrcode
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const acao = new URL(req.url).searchParams.get("acao") ?? "status"
  const ev = await getEvolutionConfig()

  if (!ev) {
    return NextResponse.json({ error: "Evolution API não configurado" }, { status: 400 })
  }

  if (acao === "status") {
    const res = await fetch(`${ev.url}/instance/fetchInstances`, {
      headers: { apikey: ev.apiKey },
    })
    if (!res.ok) return NextResponse.json({ error: "Falha ao consultar Evolution" }, { status: 502 })
    const instances: { name: string; connectionStatus: string; ownerJid: string | null; profileName: string | null; profilePicUrl: string | null }[] = await res.json()
    const instance = instances.find(i => i.name === ev.instance)
    if (!instance) return NextResponse.json({ status: "not_found" })
    return NextResponse.json({
      status: instance.connectionStatus,  // "open" | "connecting" | "close"
      ownerJid: instance.ownerJid,
      profileName: instance.profileName,
      profilePicUrl: instance.profilePicUrl,
    })
  }

  if (acao === "qrcode") {
    const res = await fetch(`${ev.url}/instance/connect/${ev.instance}`, {
      headers: { apikey: ev.apiKey },
    })
    if (!res.ok) return NextResponse.json({ error: "Falha ao gerar QR Code" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json({ base64: data.base64, code: data.code })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

// POST /api/admin/mensageria/whatsapp — ações: disconnect, delete
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { acao } = await req.json()
  const ev = await getEvolutionConfig()
  if (!ev) return NextResponse.json({ error: "Evolution não configurado" }, { status: 400 })

  if (acao === "disconnect") {
    const res = await fetch(`${ev.url}/instance/logout/${ev.instance}`, {
      method: "DELETE",
      headers: { apikey: ev.apiKey },
    })
    return NextResponse.json({ ok: res.ok })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
