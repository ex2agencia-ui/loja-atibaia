import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { memberSchema } from "@/lib/validations/member"
import { Posicao, MemberSituacao } from "@/generated/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const member = await prisma.member.findUnique({
    where: { id },
    include: { filhos: { orderBy: { dataNascimento: "asc" } } },
  })
  if (!member) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { filhos, dataNascimento, dataIniciacao, dataElevacao, dataExaltacao,
    dataInstalacao, dataRegulFiliacao, nascimentoConjuge, ...data } = parsed.data

  // Delete existing filhos and recreate
  await prisma.filho.deleteMany({ where: { memberId: id } })

  const member = await prisma.member.update({
    where: { id },
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

  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.member.update({ where: { id }, data: { situacao: "INATIVO" } })
  return NextResponse.json({ ok: true })
}
