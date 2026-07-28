import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const user = session.user as any
  return NextResponse.json({ role: user?.role ?? null, memberId: user?.memberId ?? null, membroNome: user?.name ?? null })
}
