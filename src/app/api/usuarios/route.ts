import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_USUARIOS } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  memberId: z.string().optional().nullable(),
  senha: z.string().min(6).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS)
  if (err) return err

  const { prisma } = await import("@/lib/prisma")
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
      memberId: true,
      createdAt: true,
      member: { select: { id: true, nome: true, cim: true } },
    },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS)
  if (err) return err

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { prisma } = await import("@/lib/prisma")
  const { name, email, role, memberId, senha } = parsed.data

  // Se não veio senha, busca CIM do membro vinculado
  let password: string
  if (senha) {
    password = await bcrypt.hash(senha, 12)
  } else if (memberId) {
    const member = await prisma.member.findUnique({ where: { id: memberId }, select: { cim: true } })
    if (!member) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })
    password = await bcrypt.hash(member.cim, 12)
  } else {
    return NextResponse.json({ error: "Informe uma senha ou vincule um membro" }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      role,
      password,
      mustChangePassword: true,
      memberId: memberId ?? null,
    },
    select: { id: true, name: true, email: true, role: true, memberId: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
