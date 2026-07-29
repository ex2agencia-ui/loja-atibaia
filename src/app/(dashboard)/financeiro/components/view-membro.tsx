"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, History, TrendingDown, TrendingUp, Wallet, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import { AcaoMensalidadeDialog } from "./acao-mensalidade-dialog"

type Log = {
  id: string
  campo: string
  valorAntes: string | null
  valorDepois: string | null
  motivo: string | null
  userId: string
  createdAt: string
}

type Mensalidade = {
  id: string
  competencia: string
  valor: number
  desconto: number | null
  jurosMulta: number | null
  valorTotal: number
  vencimento: string
  pagamento: string | null
  status: string
  isento: boolean
  observacao: string | null
  logs: Log[]
}

type Lancamento = {
  id: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  data: string
}

type Totais = {
  totalCompetencias: number
  pagas: number
  pendentes: number
  vencidas: number
  isentas: number
  totalPago: number
  totalPendente: number
  totalInadimplente: number
}

type Membro = { id: string; nome: string; cim: string; posicao: string; situacao: string }

type ExtratoData = {
  membro: Membro
  mensalidades: Mensalidade[]
  lancamentos: Lancamento[]
  totais: Totais
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function formatCompetencia(comp: string) {
  const [ano, mes] = comp.split("-")
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

const CAMPO_LABEL: Record<string, string> = {
  status: "Status",
  valor: "Valor",
  valorTotal: "Valor total",
  desconto: "Desconto",
  jurosMulta: "Juros/Multa",
  vencimento: "Vencimento",
  pagamento: "Pagamento",
  isento: "Isenção",
  observacao: "Observação",
}

function MensalidadeRow({ m, membroNome, queryKey }: { m: Mensalidade; membroNome: string; queryKey: unknown[] }) {
  const [expandido, setExpandido] = useState(false)
  const [acaoDialog, setAcaoDialog] = useState<{ acao: "baixa" | "acordo" | "isencao" | "reabrir" } | null>(null)
  const queryClient = useQueryClient()


  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Linha principal */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpandido((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800">{formatCompetencia(m.competencia)}</span>
            <StatusBadge status={m.status} isento={m.isento} />
          </div>
          {m.observacao && <p className="text-xs text-slate-400 mt-0.5 truncate">{m.observacao}</p>}
        </div>

        <div className="text-right shrink-0">
          <p className="font-semibold text-sm text-slate-800">{formatBRL(Number(m.valorTotal))}</p>
          {m.pagamento && <p className="text-xs text-green-600">pago em {formatData(m.pagamento)}</p>}
          {!m.pagamento && m.status !== "CANCELADO" && (
            <p className="text-xs text-slate-400">venc. {formatData(m.vencimento)}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {m.status !== "PAGO" && !m.isento && m.status !== "CANCELADO" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-700 hover:bg-green-50"
              onClick={(e) => { e.stopPropagation(); setAcaoDialog({ acao: "baixa" }) }}
            >
              Baixa
            </Button>
          )}
          {m.status === "VENCIDO" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
              onClick={(e) => { e.stopPropagation(); setAcaoDialog({ acao: "acordo" }) }}
            >
              Acordo
            </Button>
          )}
          {m.status !== "CANCELADO" && !m.isento && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-500"
              onClick={(e) => { e.stopPropagation(); setAcaoDialog({ acao: "isencao" }) }}
            >
              Isentar
            </Button>
          )}
          {(m.status === "CANCELADO" || m.isento) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-orange-600 hover:bg-orange-50"
              onClick={(e) => { e.stopPropagation(); setAcaoDialog({ acao: "reabrir" }) }}
            >
              Reabrir
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setExpandido(e2 => !e2) }}>
            {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expandido && (
        <div className="border-t bg-slate-50 px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-slate-400">Valor base</span><p className="font-medium">{formatBRL(Number(m.valor))}</p></div>
            {m.desconto ? <div><span className="text-slate-400">Desconto</span><p className="font-medium text-green-600">-{formatBRL(Number(m.desconto))}</p></div> : null}
            {m.jurosMulta ? <div><span className="text-slate-400">Juros/Multa</span><p className="font-medium text-red-600">+{formatBRL(Number(m.jurosMulta))}</p></div> : null}
          </div>

          {m.logs.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <History className="h-3 w-3" /> Histórico de alterações
                </p>
                {m.logs.map((log) => (
                  <div key={log.id} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-slate-400 shrink-0">{formatData(log.createdAt)}</span>
                    <span>
                      <span className="font-medium">{CAMPO_LABEL[log.campo] ?? log.campo}</span>
                      {log.valorAntes && log.valorDepois && (
                        <> · <span className="line-through text-slate-400">{log.valorAntes}</span> → <span className="font-medium">{log.valorDepois}</span></>
                      )}
                      {log.motivo && <span className="text-slate-400"> ({log.motivo})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {acaoDialog && (
        <AcaoMensalidadeDialog
          mensalidade={m}
          acao={acaoDialog.acao}
          membroNome={membroNome}
          onClose={() => { setAcaoDialog(null); queryClient.invalidateQueries({ queryKey }) }}
          invalidateKey={queryKey}
        />
      )}
    </div>
  )
}

export function ViewMembro({ membroIdInicial }: { membroIdInicial?: string }) {
  const [membroId, setMembroId] = useState(membroIdInicial ?? "")

  const { data: membros } = useQuery<{ id: string; nome: string; cim: string }[]>({
    queryKey: ["membros-select"],
    queryFn: () =>
      fetch("/api/membros?situacao=ATIVO&limit=200").then((r) => r.json()).then((d) => d.members ?? []),
  })

  const queryKey = ["extrato-membro", membroId]

  const { data, isLoading } = useQuery<ExtratoData>({
    queryKey,
    queryFn: () => fetch(`/api/financeiro/mensalidades/membro/${membroId}`).then((r) => r.json()),
    enabled: !!membroId,
  })

  const totais = data?.totais

  return (
    <div className="space-y-5">
      {/* Select de membro */}
      <div className="flex items-center gap-3">
        <Select value={membroId} onValueChange={(v) => v && setMembroId(v)}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecione um membro..." />
          </SelectTrigger>
          <SelectContent>
            {(membros ?? []).map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.nome} · {m.cim}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data?.membro && (
          <Badge variant="outline" className="text-slate-600">{data.membro.posicao}</Badge>
        )}
      </div>

      {!membroId && (
        <div className="py-20 text-center text-slate-400 text-sm">
          Selecione um membro para ver o extrato financeiro completo.
        </div>
      )}

      {membroId && isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      )}

      {data && (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-green-50 border-green-200 text-green-800 p-3">
              <p className="text-xs opacity-70">Total pago</p>
              <p className="text-lg font-bold">{formatBRL(totais?.totalPago ?? 0)}</p>
              <p className="text-xs opacity-60">{totais?.pagas} competências</p>
            </div>
            <div className="rounded-lg border bg-red-50 border-red-200 text-red-800 p-3">
              <p className="text-xs opacity-70">Inadimplência</p>
              <p className="text-lg font-bold">{formatBRL(totais?.totalInadimplente ?? 0)}</p>
              <p className="text-xs opacity-60">{totais?.vencidas} vencidas</p>
            </div>
            <div className="rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800 p-3">
              <p className="text-xs opacity-70">A vencer</p>
              <p className="text-lg font-bold">{formatBRL((totais?.totalPendente ?? 0) - (totais?.totalInadimplente ?? 0))}</p>
              <p className="text-xs opacity-60">{totais?.pendentes} pendentes</p>
            </div>
            <div className="rounded-lg border bg-slate-50 border-slate-200 text-slate-700 p-3">
              <p className="text-xs opacity-70">Isenções</p>
              <p className="text-lg font-bold">{totais?.isentas ?? 0}</p>
              <p className="text-xs opacity-60">competências</p>
            </div>
          </div>

          {/* Mensalidades */}
          {data.mensalidades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Mensalidades
              </h3>
              {data.mensalidades.map((m) => (
                <MensalidadeRow key={m.id} m={m} membroNome={data.membro.nome} queryKey={queryKey} />
              ))}
            </div>
          )}

          {/* Lançamentos avulsos */}
          {data.lancamentos.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="h-4 w-4" /> Lançamentos avulsos
              </h3>
              <Card>
                <CardContent className="p-0 divide-y divide-slate-100">
                  {data.lancamentos.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                      {l.tipo === "RECEITA"
                        ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                        : <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{l.descricao}</p>
                        <p className="text-xs text-slate-400">{l.categoria} · {formatData(l.data)}</p>
                      </div>
                      <p className={cn("text-sm font-semibold", l.tipo === "RECEITA" ? "text-green-700" : "text-red-700")}>
                        {l.tipo === "RECEITA" ? "+" : "-"}{formatBRL(Number(l.valor))}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {data.mensalidades.length === 0 && data.lancamentos.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-slate-300" />
              Nenhum registro financeiro para este membro.
            </div>
          )}
        </>
      )}
    </div>
  )
}
