"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Phone, Pencil } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "Comp.", MM: "Mestre", AM: "Aprendiz" }
const POSICAO_COLOR: Record<string, string> = {
  MI: "bg-purple-100 text-purple-800",
  CM: "bg-blue-100 text-blue-800",
  MM: "bg-green-100 text-green-800",
  AM: "bg-yellow-100 text-yellow-800",
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
}

export function MemberTable({ members }: { members: Member[] }) {
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
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${POSICAO_COLOR[m.posicao]}`}>
                  {m.posicao}
                </span>
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
