import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const frases = await prisma.frase.findMany({ where: { ativo: true } })
  if (frases.length === 0) return NextResponse.json(null)

  const frase = frases[Math.floor(Math.random() * frases.length)]
  return NextResponse.json(frase)
}
