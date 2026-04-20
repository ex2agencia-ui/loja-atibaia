"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "C.M.", MM: "M.M.", AM: "A.M." }

const STATUS_COLOR: Record<string, string> = {
  P:   "bg-green-100 text-green-800",
  F:   "bg-red-100 text-red-800 font-bold",
  NV:  "bg-gray-100 text-gray-500",
  AB:  "bg-blue-50 text-blue-700",
  FM:  "bg-yellow-50 text-yellow-700",
  FR:  "bg-yellow-50 text-yellow-700",
  IN:  "bg-purple-50 text-purple-700",
  SM:  "bg-orange-50 text-orange-700",
}

interface SessionCol { id: string; data: string; tipo: string }
interface MemberRow {
  memberId: string
  cim: string
  nome: string
  posicao: string
  presencas: Record<string, string>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

export default function HistoricoPresencaPage() {
  const currentYear = new Date().getFullYear()
  const [from, setFrom] = useState(`${currentYear}-01-01`)
  const [to, setTo] = useState(`${currentYear}-12-31`)
  const [applied, setApplied] = useState({ from: `${currentYear}-01-01`, to: `${currentYear}-12-31` })

  const { data, isLoading } = useQuery({
    queryKey: ["historico-presenca", applied.from, applied.to],
    queryFn: () =>
      fetch(`/api/relatorios/historico?from=${applied.from}&to=${applied.to}`).then((r) => r.json()),
  })

  const sessions: SessionCol[] = data?.sessions ?? []
  const matrix: MemberRow[] = data?.matrix ?? []

  // Count F per member for summary
  const faltas = (row: MemberRow) => sessions.filter((s) => row.presencas[s.id] === "F").length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de Presença</h1>
        <p className="text-sm text-muted-foreground">Tabela cruzada membros × sessões</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
        </div>
        <Button onClick={() => setApplied({ from, to })}>Gerar</Button>
        {sessions.length > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            {sessions.length} sessões · {matrix.length} membros
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[["P","Presente","bg-green-100 text-green-800"],["F","Falta","bg-red-100 text-red-800"],["NV","Não Válida","bg-gray-100 text-gray-500"],["AB","Abonada","bg-blue-50 text-blue-700"],["—","Sem registo","bg-white text-gray-400 border"]].map(([k,v,cls]) => (
          <span key={k} className={`px-2 py-0.5 rounded ${cls}`}>{k} = {v}</span>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma sessão no período.</p>
      ) : (
        <div className="overflow-auto border rounded-md">
          <table className="text-xs border-collapse min-w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 font-medium border-b border-r sticky left-0 bg-muted/80 z-20 min-w-[180px]">
                  Membro
                </th>
                <th className="text-center px-2 py-2 font-medium border-b border-r w-10 sticky left-[180px] bg-muted/80 z-20">
                  Pos.
                </th>
                {sessions.map((s) => (
                  <th key={s.id} className="text-center px-1 py-2 font-medium border-b border-r min-w-[42px]">
                    <div>{formatDate(s.data)}</div>
                    <div className="text-[10px] font-normal text-muted-foreground leading-tight">
                      {s.tipo === "ORDINARIA" ? "Ord" : s.tipo === "MAGNA" ? "Mag" : "Esp"}
                    </div>
                  </th>
                ))}
                <th className="text-center px-2 py-2 font-medium border-b min-w-[50px]">Faltas</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => {
                const totalFaltas = faltas(row)
                const pct = sessions.length > 0 ? totalFaltas / sessions.length : 0
                return (
                  <tr key={row.memberId} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={`px-3 py-1.5 border-b border-r font-medium sticky left-0 z-10 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>
                      {row.nome}
                    </td>
                    <td className={`px-2 py-1.5 border-b border-r text-center text-muted-foreground sticky left-[180px] z-10 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>
                      {POSICAO_LABEL[row.posicao] ?? row.posicao}
                    </td>
                    {sessions.map((s) => {
                      const status = row.presencas[s.id]
                      return (
                        <td key={s.id} className="border-b border-r text-center py-1.5 px-1">
                          {status ? (
                            <span className={`inline-block px-1 py-0.5 rounded text-[11px] leading-tight ${STATUS_COLOR[status] ?? "bg-amber-50 text-amber-800"}`}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className={`px-2 py-1.5 border-b text-center font-bold ${pct > 0.5 ? "text-red-600" : "text-gray-700"}`}>
                      {totalFaltas}/{sessions.length}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
