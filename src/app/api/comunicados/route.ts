import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const ROLES_ENVIAR = ["ADMIN", "SECRETARIO", "CHANCELARIA"]

const createSchema = z.object({
  titulo: z.string().min(2).max(200),
  texto: z.string().min(1).max(10000),
  imagens: z.array(z.string().url()).max(4).default([]),
  noFeed: z.boolean().default(false),
  destinatarios: z.enum(["todos", "selecionar"]).default("todos"),
  membrosIds: z.array(z.string()).default([]), // usado quando destinatarios="selecionar"
})

const AUTOR_SELECT = { id: true, name: true, email: true, role: true }
const DEST_INCLUDE = {
  member: { select: { id: true, nome: true } },
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20
  const skip = (page - 1) * limit

  // Admin vê todos; membro vê só os seus
  const isAdmin = ROLES_ENVIAR.includes(user?.role)

  let comunicados
  let total

  if (isAdmin) {
    ;[comunicados, total] = await Promise.all([
      prisma.comunicado.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          autor: { select: AUTOR_SELECT },
          _count: { select: { destinatarios: true } },
        },
      }),
      prisma.comunicado.count(),
    ])
  } else {
    if (!user?.memberId) return NextResponse.json({ comunicados: [], total: 0 })
    ;[comunicados, total] = await Promise.all([
      prisma.comunicadoDestinatario.findMany({
        where: { memberId: user.memberId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          comunicado: {
            include: { autor: { select: AUTOR_SELECT } },
          },
        },
      }),
      prisma.comunicadoDestinatario.count({ where: { memberId: user.memberId } }),
    ])
  }

  return NextResponse.json({ comunicados, total, page, isAdmin })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any
  if (!ROLES_ENVIAR.includes(user?.role)) {
    return NextResponse.json({ error: "Sem permissão para enviar comunicados" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { titulo, texto, imagens, noFeed, destinatarios, membrosIds } = parsed.data

  // Resolve lista de membros destinatários
  let membros: { id: string }[] = []
  if (destinatarios === "todos") {
    membros = await prisma.member.findMany({ where: { situacao: "ATIVO" }, select: { id: true } })
  } else {
    membros = membrosIds.map(id => ({ id }))
  }

  // Cria o comunicado
  const comunicado = await prisma.comunicado.create({
    data: { autorId: user.id, titulo, texto, imagens, noFeed },
  })

  // Cria destinatários
  if (membros.length > 0) {
    await prisma.comunicadoDestinatario.createMany({
      data: membros.map(m => ({ comunicadoId: comunicado.id, memberId: m.id })),
      skipDuplicates: true,
    })
  }

  // Se noFeed, cria Post no mural
  if (noFeed) {
    // Precisa de memberId do autor para criar Post
    const autorUser = await prisma.user.findUnique({ where: { id: user.id }, select: { memberId: true } })
    if (autorUser?.memberId) {
      const post = await prisma.post.create({
        data: {
          memberId: autorUser.memberId,
          tipo: "FEED",
          texto: `**${titulo}**\n\n${texto}`,
          imagens,
        },
      })
      await prisma.comunicado.update({ where: { id: comunicado.id }, data: { postId: post.id } })
    }
  }

  return NextResponse.json({ id: comunicado.id }, { status: 201 })
}
