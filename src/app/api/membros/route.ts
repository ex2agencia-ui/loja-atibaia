import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { memberSchema } from "@/lib/validations/member"
import { Posicao, MemberSituacao } from "@/generated/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const situacao = searchParams.get("situacao") as MemberSituacao | null
  const posicao = searchParams.get("posicao") as Posicao | null
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "100")

  const where = {
    ...(situacao && { situacao }),
    ...(posicao && { posicao }),
    ...(search && {
      OR: [
        { nome: { contains: search, mode: "insensitive" as const } },
        { cim: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [total, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      include: { filhos: true },
      orderBy: [{ posicao: "asc" }, { nome: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ members, total, page, limit })
}

function parseBRDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = value.trim().match(/^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/)
  if (!match) return null
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
}

function parseMaybeDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + "T12:00:00.000Z")
  }
  const br = parseBRDate(v)
  if (br) return br
  const d = new Date(v)
  if (!isNaN(d.getTime())) return d
  return null
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { filhos, dataNascimento, dataIniciacao, dataElevacao, dataExaltacao,
    dataInstalacao, dataRegulFiliacao, nascimentoConjuge, ...data } = parsed.data

  const member = await prisma.member.create({
    data: {
      ...data,
      situacao: data.situacao as MemberSituacao,
      posicao: data.posicao as Posicao,
      dataNascimento: dataNascimento ? parseMaybeDate(dataNascimento) : null,
      dataIniciacao: dataIniciacao ? parseMaybeDate(dataIniciacao) : null,
      dataElevacao: dataElevacao ? parseMaybeDate(dataElevacao) : null,
      dataExaltacao: dataExaltacao ? parseMaybeDate(dataExaltacao) : null,
      dataInstalacao: dataInstalacao ? parseMaybeDate(dataInstalacao) : null,
      dataRegulFiliacao: dataRegulFiliacao ? parseMaybeDate(dataRegulFiliacao) : null,
      nascimentoConjuge: nascimentoConjuge ? parseMaybeDate(nascimentoConjuge) : null,
      filhos: {
        create: filhos.map((f) => ({
          nome: f.nome,
          dataNascimento: f.dataNascimento ? parseMaybeDate(f.dataNascimento) : null,
        })),
      },
    },
    include: { filhos: true },
  })

  return NextResponse.json(member, { status: 201 })
}
