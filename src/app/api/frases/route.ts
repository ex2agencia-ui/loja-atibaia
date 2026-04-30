import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const frases = await prisma.frase.findMany({ orderBy: { tema: "asc" } })
  return NextResponse.json({ frases, total: frases.length })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { texto, autor, descricaoAutor, tema, ativo = true } = await req.json()
  if (!texto?.trim() || !autor?.trim() || !tema?.trim()) {
    return NextResponse.json({ error: "texto, autor e tema são obrigatórios" }, { status: 400 })
  }

  const frase = await prisma.frase.create({ data: { texto: texto.trim(), autor: autor.trim(), descricaoAutor: descricaoAutor?.trim() || null, tema: tema.trim(), ativo } })
  return NextResponse.json(frase, { status: 201 })
}
