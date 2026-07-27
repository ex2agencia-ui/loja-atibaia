import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireRole, ROLES_USUARIOS } from "@/lib/permissions"
import { z } from "zod"
import { UserRole } from "@/generated/prisma"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  memberId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS)
  if (err) return err

  const { id } = await params
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      mustChangePassword: true, memberId: true, createdAt: true,
      member: { select: { id: true, nome: true, cim: true } },
    },
  })
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const err = requireRole(session, ROLES_USUARIOS)
  if (err) return err

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.email && { email: parsed.data.email.toLowerCase() }),
      ...(parsed.data.role && { role: parsed.data.role }),
      ...("memberId" in parsed.data && { memberId: parsed.data.memberId }),
    },
    select: { id: true, name: true, email: true, role: true, memberId: true },
  })
  return NextResponse.json(user)
}
