import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sessionSchema } from "@/lib/validations/session"
import { SessionTipo } from "@/generated/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")

  const [total, sessions] = await Promise.all([
    prisma.lojaSession.count(),
    prisma.lojaSession.findMany({
      orderBy: { data: "desc" },
      include: { _count: { select: { presencas: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ sessions, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const parsed = sessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const lojaSession = await prisma.lojaSession.create({
    data: {
      data: new Date(parsed.data.data),
      descricao: parsed.data.descricao ?? null,
      tipo: (parsed.data.tipo ?? "ORDINARIA") as SessionTipo,
    },
  })

  return NextResponse.json(lojaSession, { status: 201 })
}
