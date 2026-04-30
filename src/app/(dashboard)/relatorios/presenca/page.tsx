"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatarPorcentagem } from "@/lib/utils/presence"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Download } from "lucide-react"
import { exportCSV } from "@/lib/utils/csv"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "C.M.", MM: "M.M.", AM: "A.M." }

const STATUS_COLOR: Record<string, string> = {
  P:  "bg-green-100 text-green-800",
  F:  "bg-red-100 text-red-800 font-bold",
  NV: "bg-gray-100 text-gray-500",
  AB: "bg-blue-50 text-blue-700",
  FM: "bg-yellow-50 text-yellow-700",
  FR: "bg-yellow-50 text-yellow-700",
  IN: "bg-purple-50 text-purple-700",
  SM: "bg-orange-50 text-orange-700",
}

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

interface SessionCol { id: string; data: string; tipo: string }
interface MemberRow {
  memberId: string
  cim: string
  nome: string
  posicao: string
  presencas: Record<string, string>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

export default function RelatoriosPage() {
  const currentYear = new Date().getFullYear()
  const [from, setFrom] = useState(`${currentYear}-01-01`)
  const [to, setTo] = useState(`${currentYear}-12-31`)
  const [applied, setApplied] = useState({ from: `${currentYear}-01-01`, to: `${currentYear}-12-31` })
  const [search, setSearch] = useState("")

  const { data: dataPresenca, isLoading: loadingPresenca } = useQuery({
    queryKey: ["relatorio-presenca", applied.from, applied.to],
    queryFn: () => fetch(`/api/relatorios/presenca?from=${applied.from}&to=${applied.to}`).then((r) => r.json()),
  })

  const { data: dataHistorico, isLoading: loadingHistorico } = useQuery({
    queryKey: ["historico-presenca", applied.from, applied.to],
    queryFn: () => fetch(`/api/relatorios/historico?from=${applied.from}&to=${applied.to}`).then((r) => r.json()),
  })

  const rows: RelatorioRow[] = (dataPresenca?.relatorio ?? []).filter((r: RelatorioRow) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) || r.cim.includes(search)
  )
  const negativos = rows.filter((r) => r.status === "NEGATIVO").length
  const positivos = rows.filter((r) => r.status === "POSITIVO").length

  const sessions: SessionCol[] = dataHistorico?.sessions ?? []
  const matrix: MemberRow[] = dataHistorico?.matrix ?? []
  const faltas = (row: MemberRow) => sessions.filter((s) => row.presencas[s.id] === "F").length

  function handleExport() {
    if (!rows.length) return
    exportCSV(`relatorio-presenca_${applied.from}_${applied.to}.csv`, rows.map((r) => ({
      cim: r.cim,
      nome: r.nome,
      posicao: POSICAO_LABEL[r.posicao] ?? r.posicao,
      faltas: r.faltas,
      totalSessoes: r.totalSessoes,
      porcentagem: formatarPorcentagem(r.ratio),
      situacao: r.status,
    })))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios de Presença</h1>
        <p className="text-sm text-muted-foreground">Situação de frequência por período</p>
      </div>

      {/* Filtro compartilhado */}
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
      </div>

      <Tabs defaultValue="relatorio">
        <TabsList>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* ── ABA RELATÓRIO ── */}
        <TabsContent value="relatorio" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} disabled={!rows.length}>
                <Download className="h-4 w-4 mr-2" />Exportar CSV
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {dataPresenca && (
            <div className="flex gap-4 flex-wrap">
              <div className="border rounded-lg p-3 flex-1 min-w-28 text-center">
                <div className="text-2xl font-bold">{dataPresenca.totalSessoes}</div>
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

          {loadingPresenca ? (
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
                          <Badge variant={r.status === "POSITIVO" ? "default" : "destructive"}>{r.status}</Badge>
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
                      <Badge variant={r.status === "POSITIVO" ? "default" : "destructive"} className="text-xs">{r.status}</Badge>
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
        </TabsContent>

        {/* ── ABA HISTÓRICO ── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {sessions.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs items-center">
              <span className="text-muted-foreground">{sessions.length} sessões · {matrix.length} membros</span>
              <span className="ml-2 text-muted-foreground">|</span>
              {[["P","Presente","bg-green-100 text-green-800"],["F","Falta","bg-red-100 text-red-800"],["NV","Não Válida","bg-gray-100 text-gray-500"],["AB","Abonada","bg-blue-50 text-blue-700"],["—","Sem registo","bg-white text-gray-400 border"]].map(([k,v,cls]) => (
                <span key={k} className={`px-2 py-0.5 rounded ${cls}`}>{k} = {v}</span>
              ))}
            </div>
          )}

          {loadingHistorico ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma sessão no período.</p>
          ) : (
            <div className="overflow-auto border rounded-md">
              <table className="text-xs border-collapse min-w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium border-b border-r sticky left-0 bg-muted/80 z-20 min-w-[180px]">Membro</th>
                    <th className="text-center px-2 py-2 font-medium border-b border-r w-10 sticky left-[180px] bg-muted/80 z-20">Pos.</th>
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
                        <td className={`px-3 py-1.5 border-b border-r font-medium sticky left-0 z-10 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>{row.nome}</td>
                        <td className={`px-2 py-1.5 border-b border-r text-center text-muted-foreground sticky left-[180px] z-10 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>
                          {POSICAO_LABEL[row.posicao] ?? row.posicao}
                        </td>
                        {sessions.map((s) => {
                          const status = row.presencas[s.id]
                          return (
                            <td key={s.id} className="border-b border-r text-center py-1.5 px-1">
                              {status ? (
                                <span className={`inline-block px-1 py-0.5 rounded text-[11px] leading-tight ${STATUS_COLOR[status] ?? "bg-amber-50 text-amber-800"}`}>{status}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
