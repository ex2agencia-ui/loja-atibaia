import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ count: 0 })
  const user = session.user as any
  if (!user?.memberId) return NextResponse.json({ count: 0 })

  const count = await prisma.comunicadoDestinatario.count({
    where: { memberId: user.memberId, lidoEm: null },
  })

  return NextResponse.json({ count })
}
