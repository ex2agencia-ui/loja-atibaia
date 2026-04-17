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
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      dataIniciacao: dataIniciacao ? new Date(dataIniciacao) : null,
      dataElevacao: dataElevacao ? new Date(dataElevacao) : null,
      dataExaltacao: dataExaltacao ? new Date(dataExaltacao) : null,
      dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
      dataRegulFiliacao: dataRegulFiliacao ? new Date(dataRegulFiliacao) : null,
      nascimentoConjuge: nascimentoConjuge ? new Date(nascimentoConjuge) : null,
      filhos: {
        create: filhos.map((f) => ({
          nome: f.nome,
          dataNascimento: f.dataNascimento ? new Date(f.dataNascimento) : null,
        })),
      },
    },
    include: { filhos: true },
  })

  return NextResponse.json(member, { status: 201 })
}
