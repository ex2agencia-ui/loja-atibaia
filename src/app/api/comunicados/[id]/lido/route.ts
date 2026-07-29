import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 })

  const { id: comunicadoId } = await params

  // updateMany dispara transação implícita no Neon HTTP — usar update individual
  const registros = await prisma.comunicadoDestinatario.findMany({
    where: { comunicadoId, memberId: user.memberId, lidoEm: null },
    select: { id: true },
  })
  await Promise.all(
    registros.map(r =>
      prisma.comunicadoDestinatario.update({
        where: { id: r.id },
        data: { lidoEm: new Date() },
      }).catch(() => null)
    )
  )

  return NextResponse.json({ ok: true })
}
