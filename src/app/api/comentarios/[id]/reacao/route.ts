import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({ emoji: z.string().min(1).max(10) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ error: "Apenas membros podem reagir" }, { status: 403 })

  const { id: comentarioId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { emoji } = parsed.data

  const existing = await prisma.reacao.findUnique({
    where: { memberId_comentarioId_emoji: { memberId: user.memberId, comentarioId, emoji } },
  })

  if (existing) {
    await prisma.reacao.delete({ where: { id: existing.id } })
    return NextResponse.json({ action: "removed", emoji })
  }

  await prisma.reacao.create({ data: { emoji, memberId: user.memberId, comentarioId } })
  return NextResponse.json({ action: "added", emoji })
}
