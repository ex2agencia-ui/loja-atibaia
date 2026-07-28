import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Tipo não permitido" }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande (máx 5MB)" }, { status: 400 })

  const ext = file.name.split(".").pop() ?? "jpg"
  const blob = await put(`feed/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url, key: blob.pathname })
}
