import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function toDate(s: string): Date | null {
  if (!s) return null
  const v = s.trim()
  if (!v) return null
  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + "T12:00:00.000Z")
    return isNaN(d.getTime()) ? null : d
  }
  // BR com traço ou barra: DD-MM-YYYY ou DD/MM/YYYY
  const m = v.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const filhos = await prisma.filho.findMany({
    include: { member: { select: { cim: true, nome: true } } },
    orderBy: [{ member: { nome: "asc" } }, { nome: "asc" }],
  })

  return NextResponse.json({
    filhos: filhos.map((f) => ({
      id: f.id,
      cim: f.member.cim,
      nomeIrmao: f.member.nome,
      nome: f.nome,
      dataNascimento: f.dataNascimento ? f.dataNascimento.toISOString().slice(0, 10) : "",
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const rows: Array<{ cim: string; nome: string; dataNascimento?: string }> = body.filhos ?? []

  if (!rows.length) return NextResponse.json({ error: "Nenhum dado enviado" }, { status: 400 })

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.cim || !row.nome) {
      errors.push(`Linha ignorada: cim ou nome ausente`)
      continue
    }

    const member = await prisma.member.findUnique({ where: { cim: row.cim } })
    if (!member) {
      errors.push(`Membro não encontrado: CIM ${row.cim}`)
      continue
    }

    const dataNascimento = toDate(row.dataNascimento ?? "")

    const existing = await prisma.filho.findFirst({
      where: { memberId: member.id, nome: row.nome },
    })

    if (existing) {
      await prisma.filho.update({
        where: { id: existing.id },
        data: { dataNascimento },
      })
      updated++
    } else {
      await prisma.filho.create({
        data: { memberId: member.id, nome: row.nome, dataNascimento },
      })
      created++
    }
  }

  return NextResponse.json({ created, updated, errors })
}
