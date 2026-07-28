import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createSchema = z.object({
  texto: z.string().min(1).max(2000),
  imagens: z.array(z.string().url()).max(4).default([]),
})

const INCLUDE = {
  member: { select: { id: true, nome: true, ocupacao: true } },
  reacoes: { select: { id: true, emoji: true, memberId: true } },
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: postId } = await params
  const comentarios = await prisma.comentario.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: INCLUDE,
  })
  return NextResponse.json(comentarios)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ error: "Apenas membros podem comentar" }, { status: 403 })

  const { id: postId } = await params
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const created = await prisma.comentario.create({
    data: { ...parsed.data, postId, memberId: user.memberId },
  })
  const comentario = await prisma.comentario.findUnique({ where: { id: created.id }, include: INCLUDE })
  return NextResponse.json(comentario, { status: 201 })
}
