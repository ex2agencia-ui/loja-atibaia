import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function parseBRDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = value.trim().match(/^\s*(\d{2})[\/\-](\d{2})[\/\-](\d{4})\s*$/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
}

// Converte Date do banco (salvo como meia-noite BRT = T21:00Z ou T22:00Z) para {day, month, year} BRT.
// Usa Intl para interpretar a data no fuso de São Paulo, independente do ambiente de execução.
function dateToBRT(date: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date)
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value)
  return { day: get("day"), month: get("month") - 1, year: get("year") }
}

// Serializa a data do banco como ISO string com o dia BRT correto (meio-dia UTC para evitar drift).
function toBRTISOString(date: Date): string {
  const { day, month, year } = dateToBRT(date)
  return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString()
}

function occurrenceInRange(birthday: Date, start: Date, end: Date): Date | null {
  const { day, month } = dateToBRT(birthday)
  for (const year of new Set([start.getFullYear(), end.getFullYear()])) {
    const d = new Date(year, month, day, 12, 0, 0)
    if (d >= start && d <= end) return d
  }
  return null
}

const TYPE_ORDER: Record<string, number> = {
  IRMAO: 1,
  INICIACAO: 2,
  ELEVACAO: 3,
  EXALTACAO: 4,
  REGULARIZACAO: 5,
  INSTALACAO: 6,
  CASAMENTO: 7,
  CONJUGE: 8,
  FILHO: 9,
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
    tipo:
      | "IRMAO"
      | "INICIACAO"
      | "ELEVACAO"
      | "EXALTACAO"
      | "REGULARIZACAO"
      | "INSTALACAO"
      | "CASAMENTO"
      | "CONJUGE"
      | "FILHO"
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
          nascimento: toBRTISOString(m.dataNascimento),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataNascimento).year,
        })
      }
    }

    if (m.dataIniciacao) {
      const occ = occurrenceInRange(m.dataIniciacao, start, end)
      if (occ) {
        list.push({
          tipo: "INICIACAO",
          nome: m.nome,
          nascimento: toBRTISOString(m.dataIniciacao),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataIniciacao).year,
        })
      }
    }

    if (m.dataElevacao) {
      const occ = occurrenceInRange(m.dataElevacao, start, end)
      if (occ) {
        list.push({
          tipo: "ELEVACAO",
          nome: m.nome,
          nascimento: toBRTISOString(m.dataElevacao),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataElevacao).year,
        })
      }
    }

    if (m.dataExaltacao) {
      const occ = occurrenceInRange(m.dataExaltacao, start, end)
      if (occ) {
        list.push({
          tipo: "EXALTACAO",
          nome: m.nome,
          nascimento: toBRTISOString(m.dataExaltacao),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataExaltacao).year,
        })
      }
    }

    if (m.dataRegulFiliacao) {
      const occ = occurrenceInRange(m.dataRegulFiliacao, start, end)
      if (occ) {
        list.push({
          tipo: "REGULARIZACAO",
          nome: m.nome,
          nascimento: toBRTISOString(m.dataRegulFiliacao),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataRegulFiliacao).year,
        })
      }
    }

    if (m.dataInstalacao) {
      const occ = occurrenceInRange(m.dataInstalacao, start, end)
      if (occ) {
        list.push({
          tipo: "INSTALACAO",
          nome: m.nome,
          nascimento: toBRTISOString(m.dataInstalacao),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.dataInstalacao).year,
        })
      }
    }

    if (m.dataCasamento) {
      const casamentoDate = parseBRDate(m.dataCasamento)
      if (casamentoDate) {
        const occ = occurrenceInRange(casamentoDate, start, end)
        if (occ) {
          list.push({
            tipo: "CASAMENTO",
            nome: m.nome,
            nascimento: toBRTISOString(casamentoDate),
            aniversario: occ.toISOString(),
            idade: occ.getFullYear() - dateToBRT(casamentoDate).year,
            contexto: m.conjuge ?? undefined,
          })
        }
      }
    }

    if (m.nascimentoConjuge && m.conjuge) {
      const occ = occurrenceInRange(m.nascimentoConjuge, start, end)
      if (occ) {
        list.push({
          tipo: "CONJUGE",
          nome: m.conjuge,
          nascimento: toBRTISOString(m.nascimentoConjuge),
          aniversario: occ.toISOString(),
          idade: occ.getFullYear() - dateToBRT(m.nascimentoConjuge).year,
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
            nascimento: toBRTISOString(f.dataNascimento),
            aniversario: occ.toISOString(),
            idade: occ.getFullYear() - dateToBRT(f.dataNascimento).year,
            contexto: m.nome,
          })
        }
      }
    }
  }

  list.sort((a, b) => {
    const typeOrder = TYPE_ORDER[a.tipo] - TYPE_ORDER[b.tipo]
    if (typeOrder !== 0) return typeOrder
    const dateDiff = new Date(a.aniversario).getTime() - new Date(b.aniversario).getTime()
    if (dateDiff !== 0) return dateDiff
    return a.nome.localeCompare(b.nome)
  })

  return NextResponse.json({
    aniversariantes: list,
    total: list.length,
    ultimaSessao: ultimaSessao
      ? { id: ultimaSessao.id, data: ultimaSessao.data.toISOString() }
      : null,
    periodo: { inicio: start.toISOString(), fim: end.toISOString() },
  })
}
