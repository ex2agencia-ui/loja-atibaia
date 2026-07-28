import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createSchema = z.object({
  titulo: z.string().min(3),
  descricao: z.string().min(10),
  categoria: z.enum(["SERVICO", "PRODUTO", "OPORTUNIDADE", "PROCURA"]),
  contato: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get("categoria")
  const search = searchParams.get("search") || ""
  const meusMemberId = searchParams.get("memberId") // filtro "meus anúncios"

  const where: Record<string, unknown> = { ativo: true }
  if (categoria) where.categoria = categoria
  if (meusMemberId) where.memberId = meusMemberId
  if (search) where.OR = [
    { titulo: { contains: search, mode: "insensitive" } },
    { descricao: { contains: search, mode: "insensitive" } },
    { member: { nome: { contains: search, mode: "insensitive" } } },
    { member: { ramoAtuacao: { contains: search, mode: "insensitive" } } },
  ]

  const classificados = await prisma.classificado.findMany({
    where,
    include: {
      member: {
        select: { id: true, nome: true, empresa: true, ramoAtuacao: true, telefone: true, email: true, ocupacao: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(classificados)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ error: "Usuário não vinculado a um membro" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { titulo, descricao, categoria, contato, expiresAt } = parsed.data

  const classificado = await prisma.classificado.create({
    data: {
      memberId: user.memberId,
      titulo,
      descricao,
      categoria,
      contato: contato ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json(classificado, { status: 201 })
}
