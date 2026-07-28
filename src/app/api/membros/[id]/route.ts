import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { memberSchema } from "@/lib/validations/member"
import { Posicao, MemberSituacao } from "@/generated/prisma"
import { requireRole, ROLES_READ_ALL_MEMBERS, ROLES_WRITE_MEMBERS, ROLES_DELETE_MEMBERS } from "@/lib/permissions"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any

  // MEMBRO pode acessar apenas o próprio perfil
  if (user.role === "MEMBRO") {
    if (user.memberId !== id) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  } else {
    const err = requireRole(session, ROLES_READ_ALL_MEMBERS)
    if (err) return err
  }

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      filhos: { orderBy: { dataNascimento: "asc" } },
      user: { select: { id: true, email: true, role: true, mustChangePassword: true } },
    },
  })
  if (!member) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any

  // MEMBRO pode editar apenas o próprio perfil
  if (user.role === "MEMBRO") {
    if (user.memberId !== id) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  } else {
    const err = requireRole(session, ROLES_WRITE_MEMBERS)
    if (err) return err
  }

  const body = await req.json()
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { filhos, dataNascimento, dataIniciacao, dataElevacao, dataExaltacao,
    dataInstalacao, dataRegulFiliacao, nascimentoConjuge, ...data } = parsed.data

  // MEMBRO não pode alterar campos protegidos
  if (user.role === "MEMBRO") {
    delete (data as Record<string, unknown>).cim
    delete (data as Record<string, unknown>).posicao
    delete (data as Record<string, unknown>).situacao
  }

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
  const err = requireRole(session, ROLES_DELETE_MEMBERS)
  if (err) return err

  const { id } = await params
  await prisma.member.update({ where: { id }, data: { situacao: "INATIVO" } })
  return NextResponse.json({ ok: true })
}
