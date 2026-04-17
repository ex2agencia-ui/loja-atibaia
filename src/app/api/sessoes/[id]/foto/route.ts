import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { put, del } from "@vercel/blob"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.lojaSession.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })

  if (existing.fotoKey) {
    try { await del(existing.fotoKey) } catch { /* ignore */ }
  }

  const formData = await req.formData()
  const file = formData.get("foto") as File
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })

  const blob = await put(`sessoes/${id}/${file.name}`, file, {
    access: "public",
    contentType: file.type,
  })

  await prisma.lojaSession.update({
    where: { id },
    data: { fotoUrl: blob.url, fotoKey: blob.pathname },
  })

  return NextResponse.json({ url: blob.url })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.lojaSession.findUnique({ where: { id } })
  if (existing?.fotoKey) {
    try { await del(existing.fotoKey) } catch { /* ignore */ }
  }

  await prisma.lojaSession.update({ where: { id }, data: { fotoUrl: null, fotoKey: null } })
  return NextResponse.json({ ok: true })
}
