import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function occurrenceInRange(birthday: Date, start: Date, end: Date): Date | null {
  const month = birthday.getUTCMonth()
  const day = birthday.getUTCDate()
  for (const year of new Set([start.getFullYear(), end.getFullYear()])) {
    const d = new Date(year, month, day)
    if (d >= start && d <= end) return d
  }
  return null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const periodo = searchParams.get("periodo")

  let start: Date
  let end: Date = new Date()
  end.setHours(23, 59, 59, 999)

  if (periodo === "semana") {
    start = new Date()
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
  } else if (periodo === "ultima-sessao") {
    const ultimaSessao = await prisma.lojaSession.findFirst({
      orderBy: { data: "desc" },
      select: { data: true },
    })
    start = ultimaSessao ? new Date(ultimaSessao.data) : new Date()
    start.setHours(0, 0, 0, 0)
  } else {
    const inicio = searchParams.get("inicio")
    const fim = searchParams.get("fim")
    if (!inicio || !fim) {
      return NextResponse.json({ error: "Parâmetros inicio e fim são obrigatórios" }, { status: 400 })
    }
    const [sy, sm, sd] = inicio.split("-").map(Number)
    const [ey, em, ed] = fim.split("-").map(Number)
    start = new Date(sy, sm - 1, sd, 0, 0, 0)
    end = new Date(ey, em - 1, ed, 23, 59, 59)
  }

  const [members, ultimaSessao] = await Promise.all([
    prisma.member.findMany({
      where: { situacao: "ATIVO" },
      include: { filhos: true },
      orderBy: { nome: "asc" },
    }),
    prisma.lojaSession.findFirst({
      orderBy: { data: "desc" },
      select: { id: true, data: true },
    }),
  ])

  type Aniversariante = {
    tipo: "IRMAO" | "CONJUGE" | "FILHO"
    nome: string
    nascimento: string
    aniversario: string
    idade: number
    contexto?: string
  }

  const list: Aniversariante[] = []

  for (const m of members) {
    if (m.dataNascimento) {
      const occ = occurrenceInRange(m.dataNascimento, start, end)
      if (occ) {
        list.push({
          tipo: "IRMAO",
          nome: m.nome,
          nascimento: m.dataNascimento.toISOString(),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - m.dataNascimento.getUTCFullYear(),
        })
      }
    }

    if (m.nascimentoConjuge && m.conjuge) {
      const occ = occurrenceInRange(m.nascimentoConjuge, start, end)
      if (occ) {
        list.push({
          tipo: "CONJUGE",
          nome: m.conjuge,
          nascimento: m.nascimentoConjuge.toISOString(),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - m.nascimentoConjuge.getUTCFullYear(),
          contexto: m.nome,
        })
      }
    }

    for (const f of m.filhos) {
      if (f.dataNascimento) {
        const occ = occurrenceInRange(f.dataNascimento, start, end)
        if (occ) {
          list.push({
            tipo: "FILHO",
            nome: f.nome,
            nascimento: f.dataNascimento.toISOString(),
            aniversario: occ.toISOString(),
            idade: occ.getFullYear() - f.dataNascimento.getUTCFullYear(),
            contexto: m.nome,
          })
        }
      }
    }
  }

  list.sort((a, b) => new Date(a.aniversario).getTime() - new Date(b.aniversario).getTime())

  return NextResponse.json({
    aniversariantes: list,
    total: list.length,
    ultimaSessao: ultimaSessao
      ? { id: ultimaSessao.id, data: ultimaSessao.data.toISOString() }
      : null,
    periodo: { inicio: start.toISOString(), fim: end.toISOString() },
  })
}
