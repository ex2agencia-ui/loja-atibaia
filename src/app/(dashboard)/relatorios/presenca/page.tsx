"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatarPorcentagem } from "@/lib/utils/presence"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "C.M.", MM: "M.M.", AM: "A.M." }

interface RelatorioRow {
  memberId: string
  cim: string
  nome: string
  posicao: string
  faltas: number
  totalSessoes: number
  ratio: number
  status: "POSITIVO" | "NEGATIVO"
}

export default function RelatorioPresencaPage() {
  const currentYear = new Date().getFullYear()
  const [from, setFrom] = useState(`${currentYear}-01-01`)
  const [to, setTo] = useState(`${currentYear}-12-31`)
  const [applied, setApplied] = useState({ from: `${currentYear}-01-01`, to: `${currentYear}-12-31` })
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio-presenca", applied.from, applied.to],
    queryFn: () =>
      fetch(`/api/relatorios/presenca?from=${applied.from}&to=${applied.to}`).then((r) => r.json()),
  })

  const rows: RelatorioRow[] = (data?.relatorio ?? []).filter((r: RelatorioRow) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) || r.cim.includes(search)
  )

  const negativos = rows.filter((r) => r.status === "NEGATIVO").length
  const positivos = rows.filter((r) => r.status === "POSITIVO").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatório de Presença</h1>
        <p className="text-sm text-muted-foreground">Situação de frequência por período</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)} className="w-36" />
        </div>
        <Button onClick={() => setApplied({ from, to })}>Gerar</Button>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9 w-48"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {data && (
        <div className="flex gap-4 flex-wrap">
          <div className="border rounded-lg p-3 flex-1 min-w-28 text-center">
            <div className="text-2xl font-bold">{data.totalSessoes}</div>
            <div className="text-xs text-muted-foreground">Sessões no período</div>
          </div>
          <div className="border rounded-lg p-3 flex-1 min-w-28 text-center">
            <div className="text-2xl font-bold text-green-600">{positivos}</div>
            <div className="text-xs text-muted-foreground">Positivos</div>
          </div>
          <div className="border rounded-lg p-3 flex-1 min-w-28 text-center">
            <div className="text-2xl font-bold text-red-600">{negativos}</div>
            <div className="text-xs text-muted-foreground">Negativos</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <>
          <div className="hidden md:block border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left px-4 py-3 font-medium">CIM</th>
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium">Pos.</th>
                  <th className="text-right px-4 py-3 font-medium">Faltas</th>
                  <th className="text-right px-4 py-3 font-medium">Sessões</th>
                  <th className="text-right px-4 py-3 font-medium">%</th>
                  <th className="text-center px-4 py-3 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.memberId} className={`border-b hover:bg-muted/20 ${r.status === "NEGATIVO" ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{r.cim}</td>
                    <td className="px-4 py-2 font-medium">{r.nome}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{POSICAO_LABEL[r.posicao]}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-medium">{r.faltas}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{r.totalSessoes}</td>
                    <td className="px-4 py-2 text-right">{formatarPorcentagem(r.ratio)}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={r.status === "POSITIVO" ? "default" : "destructive"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {rows.map((r) => (
              <div key={r.memberId} className={`border rounded-lg p-3 ${r.status === "NEGATIVO" ? "border-red-200 bg-red-50/30" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{r.nome}</div>
                    <div className="text-xs text-muted-foreground">{r.cim} · {POSICAO_LABEL[r.posicao]}</div>
                  </div>
                  <Badge variant={r.status === "POSITIVO" ? "default" : "destructive"} className="text-xs">
                    {r.status}
                  </Badge>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{r.faltas} faltas</span>
                  <span>{r.totalSessoes} sessões</span>
                  <span>{formatarPorcentagem(r.ratio)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
