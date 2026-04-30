import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { texto, autor, descricaoAutor, tema, ativo } = await req.json()

  const frase = await prisma.frase.update({
    where: { id },
    data: {
      ...(texto !== undefined && { texto: texto.trim() }),
      ...(autor !== undefined && { autor: autor.trim() }),
      ...(descricaoAutor !== undefined && { descricaoAutor: descricaoAutor?.trim() || null }),
      ...(tema !== undefined && { tema: tema.trim() }),
      ...(ativo !== undefined && { ativo }),
    },
  })
  return NextResponse.json(frase)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.frase.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
