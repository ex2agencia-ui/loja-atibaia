"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Phone, Pencil } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CriarContaDialog } from "./acesso-sistema-card"
import { useQueryClient } from "@tanstack/react-query"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "Comp.", MM: "Mestre", AM: "Aprendiz" }
const POSICAO_COLOR: Record<string, string> = {
  MI: "bg-purple-100 text-purple-800",
  CM: "bg-blue-100 text-blue-800",
  MM: "bg-green-100 text-green-800",
  AM: "bg-yellow-100 text-yellow-800",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SECRETARIO: "Secretário",
  CHANCELARIA: "Chancelaria",
  FINANCEIRO: "Financeiro",
  MEMBRO: "Membro",
}
const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  SECRETARIO: "bg-indigo-100 text-indigo-700",
  CHANCELARIA: "bg-violet-100 text-violet-700",
  FINANCEIRO: "bg-emerald-100 text-emerald-700",
  MEMBRO: "bg-slate-100 text-slate-600",
}

interface Member {
  id: string
  cim: string
  nome: string
  posicao: string
  situacao: string
  dataNascimento: string | null
  telefone: string | null
  isWhatsapp: boolean
  email: string | null
  user?: { role: string } | null
}

export function MemberTable({ members, isAdmin }: { members: Member[]; isAdmin?: boolean }) {
  const qc = useQueryClient()

  function onAccountCreated() {
    qc.invalidateQueries({ queryKey: ["members"] })
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left px-4 py-3 font-medium">CIM</th>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Posição</th>
              <th className="text-left px-4 py-3 font-medium">Situação</th>
              <th className="text-left px-4 py-3 font-medium">Nascimento</th>
              <th className="text-left px-4 py-3 font-medium">Contato</th>
              <th className="text-left px-4 py-3 font-medium">Acesso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.cim}</td>
                <td className="px-4 py-3 font-medium">{m.nome}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${POSICAO_COLOR[m.posicao]}`}>
                    {POSICAO_LABEL[m.posicao] || m.posicao}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={m.situacao === "ATIVO" ? "default" : "secondary"}>
                    {m.situacao}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatarData(m.dataNascimento)}</td>
                <td className="px-4 py-3">
                  {m.telefone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {m.telefone}
                      {m.isWhatsapp && <span className="text-green-600 font-medium">W</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.user?.role ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLOR[m.user.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[m.user.role] ?? m.user.role}
                    </span>
                  ) : isAdmin ? (
                    <CriarContaDialog
                      memberId={m.id}
                      membroNome={m.nome}
                      membroEmail={m.email}
                      onCreated={onAccountCreated}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/membros/${m.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {members.map((m) => (
          <Link key={m.id} href={`/membros/${m.id}`} className="block">
            <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{m.nome}</div>
                  <div className="text-xs text-muted-foreground font-mono">{m.cim}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.user?.role ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLOR[m.user.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[m.user.role] ?? m.user.role}
                    </span>
                  ) : null}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${POSICAO_COLOR[m.posicao]}`}>
                    {m.posicao}
                  </span>
                </div>
              </div>
              {m.telefone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Phone className="h-3 w-3" />{m.telefone}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
