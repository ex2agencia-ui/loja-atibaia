import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createSchema = z.object({
  tipo: z.enum(["FEED", "CLASSIFICADO"]).default("FEED"),
  texto: z.string().min(1).max(5000),
  imagens: z.array(z.string().url()).max(4).default([]),
  titulo: z.string().min(2).max(200).optional().nullable(),
  categoria: z.enum(["SERVICO", "PRODUTO", "OPORTUNIDADE", "PROCURA"]).optional().nullable(),
  contato: z.string().max(200).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
})

const POST_INCLUDE = {
  member: { select: { id: true, nome: true, ocupacao: true, empresa: true } },
  reacoes: { select: { id: true, emoji: true, memberId: true } },
  _count: { select: { comentarios: true } },
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get("tipo") ?? undefined
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 30)

  const posts = await prisma.post.findMany({
    where: {
      ativo: true,
      ...(tipo ? { tipo: tipo as "FEED" | "CLASSIFICADO" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: POST_INCLUDE,
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ posts: items, nextCursor })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ error: "Apenas membros podem publicar" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { expiresAt, ...data } = parsed.data

  const post = await prisma.post.create({
    data: {
      ...data,
      memberId: user.memberId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: POST_INCLUDE,
  })

  return NextResponse.json(post, { status: 201 })
}
