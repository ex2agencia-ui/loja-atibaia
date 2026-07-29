import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { memberSchema } from "@/lib/validations/member"
import { Posicao, MemberSituacao } from "@/generated/prisma"
import { requireRole, ROLES_READ_ALL_MEMBERS, ROLES_WRITE_MEMBERS } from "@/lib/permissions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_READ_ALL_MEMBERS)
  if (err) return err

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
      include: {
        filhos: true,
        user: { select: { role: true } },
      },
      orderBy: [{ posicao: "asc" }, { nome: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ members, total, page, limit })
}

function parseMaybeDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const v = value.trim()
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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_WRITE_MEMBERS)
  if (err) return err

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
    },
  })

  if (filhos.length > 0) {
    await Promise.all(
      filhos.map(f =>
        prisma.filho.create({
          data: {
            memberId: member.id,
            nome: f.nome,
            dataNascimento: f.dataNascimento ? parseMaybeDate(f.dataNascimento) : null,
          },
        }).catch(() => null)
      )
    )
  }

  return NextResponse.json(member, { status: 201 })
}
