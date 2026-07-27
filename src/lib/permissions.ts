import type { UserRole } from "@/generated/prisma"
import { NextResponse } from "next/server"

export type { UserRole }

// Resources and actions used for permission checks
export type Resource =
  | "membros"
  | "sessoes"
  | "relatorios"
  | "financeiro"
  | "usuarios"
  | "perfil"
  | "frases"

export type Action = "read" | "write" | "delete"

type PermissionMatrix = Record<UserRole, Partial<Record<Resource, Action[]>>>

const matrix: PermissionMatrix = {
  ADMIN: {
    membros: ["read", "write", "delete"],
    sessoes: ["read", "write", "delete"],
    relatorios: ["read"],
    financeiro: ["read", "write"],
    usuarios: ["read", "write", "delete"],
    perfil: ["read", "write"],
    frases: ["read", "write", "delete"],
  },
  SECRETARIO: {
    membros: ["read", "write"],
    sessoes: ["read", "write"],
    relatorios: ["read"],
    perfil: ["read", "write"],
    frases: ["read", "write"],
  },
  CHANCELARIA: {
    membros: ["read", "write"],
    sessoes: ["read", "write"],
    relatorios: ["read"],
    perfil: ["read", "write"],
    frases: ["read"],
  },
  FINANCEIRO: {
    membros: ["read"],
    sessoes: ["read"],
    relatorios: ["read"],
    financeiro: ["read", "write"],
    perfil: ["read", "write"],
  },
  MEMBRO: {
    sessoes: ["read"],
    perfil: ["read", "write"],
  },
}

export function can(role: UserRole, resource: Resource, action: Action): boolean {
  return matrix[role]?.[resource]?.includes(action) ?? false
}

// Roles that have full member list access (read all members)
export const ROLES_READ_ALL_MEMBERS: UserRole[] = ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"]
export const ROLES_WRITE_MEMBERS: UserRole[] = ["ADMIN", "SECRETARIO", "CHANCELARIA"]
export const ROLES_DELETE_MEMBERS: UserRole[] = ["ADMIN"]
export const ROLES_SESSOES_WRITE: UserRole[] = ["ADMIN", "SECRETARIO", "CHANCELARIA"]
export const ROLES_RELATORIOS: UserRole[] = ["ADMIN", "SECRETARIO", "FINANCEIRO"]
export const ROLES_FINANCEIRO: UserRole[] = ["ADMIN", "FINANCEIRO"]
export const ROLES_USUARIOS: UserRole[] = ["ADMIN"]
export const ROLES_FRASES_WRITE: UserRole[] = ["ADMIN", "SECRETARIO"]

/**
 * Returns 403 response if the session role is not in the allowed list.
 * Usage in API routes: const err = requireRole(session, ROLES_WRITE_MEMBERS); if (err) return err;
 */
export function requireRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  allowed: UserRole[]
): NextResponse | null {
  const role = session?.user?.role as UserRole | undefined
  if (!role || !allowed.includes(role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }
  return null
}
