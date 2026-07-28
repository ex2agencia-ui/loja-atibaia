import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const user = session.user as any
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isOwner = post.memberId === user?.memberId
  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(user?.role)
  if (!isOwner && !isPrivileged) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
