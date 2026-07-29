"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  TrendingUp, TrendingDown, Wallet, Plus, Search,
  Paperclip, Trash2, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NovoLancamentoSheet } from "./novo-lancamento-sheet"

const CATEGORIA_LABEL: Record<string, string> = {
  MENSALIDADE:          "Mensalidade",
  TRONCO_SOLIDARIEDADE: "Tronco de Solidariedade",
  TAXA_GRAU:            "Taxa de Grau",
  DOACAO:               "Doação",
  MANUTENCAO_TEMPLO:    "Manutenção do Templo",
  AGAPE:                "Ágape",
  REPASSE_POTENCIA:     "Repasse à Potência",
  OUTROS:               "Outros",
}

type Lancamento = {
  id: string
  tipo: "RECEITA" | "DESPESA"
  categoria: string
  descricao: string
  valor: number
  data: string
  comprovanteUrl: string | null
  member: { id: string; nome: string; cim: string } | null
}

type Totais = {
  receitas: number
  despesas: number
  saldo: number
  total: number
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function periodoAtual() {
  const now = new Date()
  const de = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const ate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { de, ate }
}

export function ViewCaixa({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const { de: deInit, ate: ateInit } = periodoAtual()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [de, setDe] = useState(deInit)
  const [ate, setAte] = useState(ateInit)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (filtroTipo) params.set("tipo", filtroTipo)
  if (filtroCategoria) params.set("categoria", filtroCategoria)
  if (busca) params.set("busca", busca)
  if (de) params.set("de", de)
  if (ate) params.set("ate", ate)

  const queryKey = ["caixa", filtroTipo, filtroCategoria, busca, de, ate]

  const { data, isLoading } = useQuery<{ lancamentos: Lancamento[]; totais: Totais }>({
    queryKey,
    queryFn: () => fetch(`/api/financeiro/caixa?${params}`).then((r) => r.json()),
  })

  const { mutate: deletar, isPending: deletando } = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/financeiro/caixa/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixa"] })
      setDeletandoId(null)
    },
  })

  const lancamentos = data?.lancamentos ?? []
  const totais = data?.totais

  return (
    <div className="space-y-5">
      {/* Resumo financeiro */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-green-50 border-green-200 text-green-800 p-4">
            <p className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Receitas</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais?.receitas ?? 0)}</p>
          </div>
          <div className="rounded-lg border bg-red-50 border-red-200 text-red-800 p-4">
            <p className="text-xs opacity-70 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Despesas</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais?.despesas ?? 0)}</p>
          </div>
          <div className={cn(
            "rounded-lg border p-4",
            (totais?.saldo ?? 0) >= 0
              ? "bg-indigo-50 border-indigo-200 text-indigo-800"
              : "bg-orange-50 border-orange-200 text-orange-800"
          )}>
            <p className="text-xs opacity-70 flex items-center gap-1"><Wallet className="h-3 w-3" /> Saldo do período</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais?.saldo ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Filtros + botão novo */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              className="pl-8 w-48 h-9"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v === "todos" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="RECEITA">Receitas</SelectItem>
              <SelectItem value="DESPESA">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroCategoria} onValueChange={(v) => setFiltroCategoria(v === "todas" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-52 h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input type="date" className="h-9 w-36" value={de} onChange={(e) => setDe(e.target.value)} />
            <span className="text-slate-400 text-sm">até</span>
            <Input type="date" className="h-9 w-36" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>

        <Button onClick={() => setSheetOpen(true)} className="gap-2 h-9">
          <Plus className="h-4 w-4" /> Novo lançamento
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-none" />)}
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Nenhum lançamento encontrado para o período.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Cabeçalho */}
              <div className="grid grid-cols-[90px_1fr_160px_100px_80px_36px] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-t-lg">
                <span>Data</span>
                <span>Descrição / Categoria</span>
                <span>Membro</span>
                <span className="text-right">Valor</span>
                <span className="text-center">Doc</span>
                <span />
              </div>

              {lancamentos.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[90px_1fr_160px_100px_80px_36px] gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs text-slate-500">{formatData(l.data)}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {l.tipo === "RECEITA"
                        ? <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        : <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      }
                      <span className="text-sm font-medium text-slate-800 truncate">{l.descricao}</span>
                    </div>
                    <Badge variant="outline" className="text-xs mt-0.5 text-slate-500 border-slate-200">
                      {CATEGORIA_LABEL[l.categoria] ?? l.categoria}
                    </Badge>
                  </div>

                  <span className="text-xs text-slate-500 truncate">
                    {l.member?.nome ?? <span className="text-slate-300">—</span>}
                  </span>

                  <span className={cn(
                    "text-sm font-semibold text-right",
                    l.tipo === "RECEITA" ? "text-green-700" : "text-red-700"
                  )}>
                    {l.tipo === "RECEITA" ? "+" : "-"}{formatBRL(Number(l.valor))}
                  </span>

                  <div className="flex justify-center">
                    {l.comprovanteUrl ? (
                      <a
                        href={l.comprovanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-xs"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </div>

                  <div className="flex justify-end">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeletandoId(l.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet novo lançamento */}
      <NovoLancamentoSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Confirm delete */}
      <AlertDialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento será permanentemente removido do caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deletandoId && deletar(deletandoId)}
              disabled={deletando}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
