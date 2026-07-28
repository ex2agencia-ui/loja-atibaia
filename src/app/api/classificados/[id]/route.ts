import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateSchema = z.object({
  titulo: z.string().min(3).optional(),
  descricao: z.string().min(10).optional(),
  categoria: z.enum(["SERVICO", "PRODUTO", "OPORTUNIDADE", "PROCURA"]).optional(),
  contato: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const user = session.user as any
  const existing = await prisma.classificado.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isOwner = existing.memberId === user?.memberId
  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(user?.role)
  if (!isOwner && !isPrivileged) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.classificado.update({
    where: { id },
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : parsed.data.expiresAt === null ? null : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const user = session.user as any
  const existing = await prisma.classificado.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isOwner = existing.memberId === user?.memberId
  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(user?.role)
  if (!isOwner && !isPrivileged) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  await prisma.classificado.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
