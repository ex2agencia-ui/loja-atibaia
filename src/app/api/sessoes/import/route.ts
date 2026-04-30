import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const TIPOS = ["ORDINARIA", "MAGNA", "ESPECIAL"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sessions } = await req.json()
  if (!Array.isArray(sessions)) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  let created = 0
  const errors: string[] = []

  for (const row of sessions) {
    const dataStr = row.data?.trim()
    if (!dataStr) { errors.push(`Linha ignorada — data ausente`); continue }

    try {
      await prisma.lojaSession.create({
        data: {
          data: new Date(dataStr),
          tipo: TIPOS.includes(row.tipo) ? row.tipo : "ORDINARIA",
          descricao: row.descricao || null,
        },
      })
      created++
    } catch (e) {
      errors.push(`Data ${dataStr}: ${String(e).slice(0, 80)}`)
    }
  }

  return NextResponse.json({ created, errors })
}
