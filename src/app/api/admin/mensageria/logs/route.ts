import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const canal = searchParams.get("canal")
  const evento = searchParams.get("evento")
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50

  const where: Record<string, unknown> = {}
  if (canal) where.canal = canal
  if (evento) where.evento = evento
  if (status) where.status = status

  const [logs, total] = await Promise.all([
    prisma.notificacaoLog.findMany({
      where,
      include: { member: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.notificacaoLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
