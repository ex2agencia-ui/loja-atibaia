"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import { AcaoMensalidadeDialog } from "./acao-mensalidade-dialog"

type Mensalidade = {
  id: string
  competencia: string
  valor: number
  valorTotal: number
  vencimento: string
  pagamento: string | null
  status: string
  isento: boolean
  observacao: string | null
}

type MembroRow = {
  id: string
  nome: string
  cim: string
  posicao: string
  mensalidade: Mensalidade | null
}

type Totais = {
  total: number
  comMensalidade: number
  semMensalidade: number
  pagos: number
  pendentes: number
  vencidos: number
  isentos: number
  totalPago: number
  totalPendente: number
}

function competenciaAtual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function gerarOpcoesMeses(qtd = 24) {
  const opcoes = []
  const now = new Date()
  for (let i = 0; i < qtd; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    opcoes.push({ valor, label })
  }
  return opcoes
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className={cn("rounded-lg border p-4 flex items-start gap-3", color)}>
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function ViewCompetencia({ onVerMembro }: { onVerMembro: (id: string) => void }) {
  const queryClient = useQueryClient()
  const opcoes = gerarOpcoesMeses()
  const [competencia, setCompetencia] = useState(competenciaAtual())
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [acaoDialog, setAcaoDialog] = useState<{
    mensalidade: Mensalidade; acao: "baixa" | "acordo" | "isencao" | "reabrir"; membroNome: string
  } | null>(null)

  const queryKey = ["mensalidades-competencia", competencia]

  const { data, isLoading } = useQuery<{ membros: MembroRow[]; totais: Totais }>({
    queryKey,
    queryFn: () =>
      fetch(`/api/financeiro/mensalidades?competencia=${competencia}`).then((r) => r.json()),
  })

  const { mutate: gerarLote, isPending: gerando } = useMutation({
    mutationFn: () =>
      fetch("/api/financeiro/mensalidades/gerar-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      alert(res.message)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const membros = data?.membros ?? []
  const totais = data?.totais

  const membrosFiltrados = membros.filter((m) => {
    if (filtroStatus === "sem") return !m.mensalidade
    if (filtroStatus === "todos") return true
    return m.mensalidade?.status === filtroStatus.toUpperCase()
  })

  const mesesLabel = opcoes.find((o) => o.valor === competencia)?.label ?? competencia

  const navMes = (delta: number) => {
    const [ano, mes] = competencia.split("-").map(Number)
    const d = new Date(ano, mes - 1 + delta, 1)
    setCompetencia(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho de competência */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navMes(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Select value={competencia} onValueChange={(v) => v && setCompetencia(v)}>
            <SelectTrigger className="w-48">
              <SelectValue>{mesesLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {opcoes.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => navMes(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <Button onClick={() => gerarLote()} disabled={gerando} variant="outline" className="gap-2">
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Gerar lote do mês
        </Button>
      </div>

      {/* Totalizadores */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : totais ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Pagos" value={totais.pagos} sub={formatBRL(totais.totalPago)} color="bg-green-50 border-green-200 text-green-800" />
          <StatCard icon={Clock} label="Pendentes" value={totais.pendentes} sub={formatBRL(totais.totalPendente)} color="bg-yellow-50 border-yellow-200 text-yellow-800" />
          <StatCard icon={AlertTriangle} label="Vencidos" value={totais.vencidos} color="bg-red-50 border-red-200 text-red-800" />
          <StatCard icon={Users} label="Sem cobrança" value={totais.semMensalidade} color="bg-slate-50 border-slate-200 text-slate-700" />
        </div>
      ) : null}

      {/* Filtro de status */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "todos", label: "Todos" },
          { key: "PAGO", label: "Pagos" },
          { key: "PENDENTE", label: "Pendentes" },
          { key: "VENCIDO", label: "Vencidos" },
          { key: "sem", label: "Sem cobrança" },
        ].map((f) => (
          <Badge
            key={f.key}
            variant={filtroStatus === f.key ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setFiltroStatus(f.key)}
          >
            {f.label}
          </Badge>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-none" />)}
            </div>
          ) : membrosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Nenhum membro encontrado para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header */}
              <div className="grid grid-cols-[2fr_80px_100px_auto] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-t-lg">
                <span>Membro</span>
                <span className="text-right">Valor</span>
                <span className="text-center">Status</span>
                <span className="text-right">Ações</span>
              </div>

              {membrosFiltrados.map((m) => (
                <div key={m.id} className="grid grid-cols-[2fr_80px_100px_auto] gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{m.nome}</p>
                    <p className="text-xs text-slate-400">{m.cim} · {m.posicao}</p>
                  </div>

                  <div className="text-right text-sm font-medium text-slate-700">
                    {m.mensalidade ? formatBRL(Number(m.mensalidade.valorTotal)) : <span className="text-slate-300">—</span>}
                  </div>

                  <div className="flex justify-center">
                    {m.mensalidade
                      ? <StatusBadge status={m.mensalidade.status} isento={m.mensalidade.isento} />
                      : <Badge variant="outline" className="text-slate-400 border-slate-200">—</Badge>
                    }
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-500"
                      onClick={() => onVerMembro(m.id)}
                    >
                      Extrato
                    </Button>

                    {m.mensalidade && m.mensalidade.status !== "PAGO" && !m.mensalidade.isento && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                        onClick={() => setAcaoDialog({ mensalidade: m.mensalidade!, acao: "baixa", membroNome: m.nome })}
                      >
                        Baixa
                      </Button>
                    )}

                    {m.mensalidade && m.mensalidade.status === "VENCIDO" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => setAcaoDialog({ mensalidade: m.mensalidade!, acao: "acordo", membroNome: m.nome })}
                      >
                        Acordo
                      </Button>
                    )}

                    {m.mensalidade && m.mensalidade.status !== "CANCELADO" && !m.mensalidade.isento && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setAcaoDialog({ mensalidade: m.mensalidade!, acao: "isencao", membroNome: m.nome })}
                      >
                        Isentar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {acaoDialog && (
        <AcaoMensalidadeDialog
          mensalidade={acaoDialog.mensalidade}
          acao={acaoDialog.acao}
          membroNome={acaoDialog.membroNome}
          onClose={() => setAcaoDialog(null)}
          invalidateKey={queryKey}
        />
      )}
    </div>
  )
}
