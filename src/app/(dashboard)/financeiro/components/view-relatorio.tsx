"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

type LinhaBalancete = {
  categoria: string
  categoriaLabel: string
  receitas: number
  despesas: number
  saldo: number
}

type Totais = {
  receitas: number
  despesas: number
  saldo: number
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function primeiroDiaMes(offset = 0) {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).toISOString().slice(0, 10)
}

function ultimoDiaMes(offset = 0) {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0).toISOString().slice(0, 10)
}

export function ViewRelatorio() {
  const [de, setDe] = useState(primeiroDiaMes(-5)) // 6 meses atrás
  const [ate, setAte] = useState(ultimoDiaMes(0))
  const [buscando, setBuscando] = useState(false)
  const [filtro, setFiltro] = useState({ de: primeiroDiaMes(-5), ate: ultimoDiaMes(0) })

  const { data, isLoading } = useQuery<{ balancete: LinhaBalancete[]; totais: Totais }>({
    queryKey: ["financeiro-relatorio", filtro.de, filtro.ate],
    queryFn: () =>
      fetch(`/api/financeiro/relatorio?de=${filtro.de}&ate=${filtro.ate}`).then((r) => r.json()),
  })

  const balancete = data?.balancete ?? []
  const totais = data?.totais

  const handleBuscar = () => setFiltro({ de, ate })

  const handleExportCSV = async () => {
    setBuscando(true)
    try {
      const res = await fetch(`/api/financeiro/relatorio?de=${filtro.de}&ate=${filtro.ate}&formato=csv`)
      const blob = await res.blob()
      const deStr = filtro.de.slice(0, 7)
      const ateStr = filtro.ate.slice(0, 7)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `balancete-${deStr}-${ateStr}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Filtros de período */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label className="text-xs">De</Label>
          <Input type="date" className="h-9 w-36" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" className="h-9 w-36" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <Button className="h-9" onClick={handleBuscar}>Gerar relatório</Button>
        <Button
          variant="outline"
          className="h-9 gap-2 ml-auto"
          onClick={handleExportCSV}
          disabled={buscando || balancete.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de totais */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : totais ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-green-50 border-green-200 text-green-800 p-4">
            <p className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Total receitas</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais.receitas)}</p>
          </div>
          <div className="rounded-lg border bg-red-50 border-red-200 text-red-800 p-4">
            <p className="text-xs opacity-70 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Total despesas</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais.despesas)}</p>
          </div>
          <div className={cn(
            "rounded-lg border p-4",
            (totais.saldo) >= 0
              ? "bg-indigo-50 border-indigo-200 text-indigo-800"
              : "bg-orange-50 border-orange-200 text-orange-800"
          )}>
            <p className="text-xs opacity-70 flex items-center gap-1"><Wallet className="h-3 w-3" /> Saldo do período</p>
            <p className="text-xl font-bold mt-1">{formatBRL(totais.saldo)}</p>
          </div>
        </div>
      ) : null}

      {/* Tabela balancete por categoria */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-none" />)}
            </div>
          ) : balancete.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhum lançamento no período selecionado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Cabeçalho */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-t-lg">
                <span>Categoria</span>
                <span className="text-right">Receitas</span>
                <span className="text-right">Despesas</span>
                <span className="text-right">Saldo</span>
              </div>

              {balancete.map((linha) => (
                <div
                  key={linha.categoria}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">{linha.categoriaLabel}</span>
                  <span className="text-sm text-right text-green-700 font-medium">
                    {linha.receitas > 0 ? formatBRL(linha.receitas) : <span className="text-slate-300">—</span>}
                  </span>
                  <span className="text-sm text-right text-red-700 font-medium">
                    {linha.despesas > 0 ? formatBRL(linha.despesas) : <span className="text-slate-300">—</span>}
                  </span>
                  <span className={cn(
                    "text-sm text-right font-semibold",
                    linha.saldo >= 0 ? "text-indigo-700" : "text-orange-700"
                  )}>
                    {formatBRL(linha.saldo)}
                  </span>
                </div>
              ))}

              {/* Rodapé total */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center bg-slate-50 rounded-b-lg border-t-2 border-slate-200">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="text-sm text-right font-bold text-green-700">
                  {formatBRL(totais?.receitas ?? 0)}
                </span>
                <span className="text-sm text-right font-bold text-red-700">
                  {formatBRL(totais?.despesas ?? 0)}
                </span>
                <span className={cn(
                  "text-sm text-right font-bold",
                  (totais?.saldo ?? 0) >= 0 ? "text-indigo-700" : "text-orange-700"
                )}>
                  {formatBRL(totais?.saldo ?? 0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
