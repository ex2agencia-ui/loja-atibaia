"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Cake, Search, Users, Heart, Baby } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatarData } from "@/lib/utils/format"

type Periodo = "semana" | "ultima-sessao" | "personalizado"

type Aniversariante = {
  tipo:
    | "IRMAO"
    | "INICIACAO"
    | "ELEVACAO"
    | "EXALTACAO"
    | "REGULARIZACAO"
    | "INSTALACAO"
    | "CASAMENTO"
    | "CONJUGE"
    | "FILHO"
  nome: string
  nascimento: string
  aniversario: string
  idade: number
  contexto?: string
}

type ApiResponse = {
  aniversariantes: Aniversariante[]
  total: number
  ultimaSessao: { id: string; data: string } | null
  periodo: { inicio: string; fim: string }
}

const TIPO_CONFIG = {
  IRMAO: { label: "Irmão", icon: Users, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  INICIACAO: { label: "Iniciação", icon: Users, color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  ELEVACAO: { label: "Elevação", icon: Users, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  EXALTACAO: { label: "Exaltação", icon: Users, color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  REGULARIZACAO: { label: "Regularização", icon: Users, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  INSTALACAO: { label: "Instalação", icon: Users, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  CASAMENTO: { label: "Casamento", icon: Heart, color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  CONJUGE: { label: "Cônjuge", icon: Heart, color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  FILHO: { label: "Filho/a", icon: Baby, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function AniversariosPage() {
  const [periodo, setPeriodo] = useState<Periodo>("semana")
  const [customInicio, setCustomInicio] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return toInputDate(d)
  })
  const [customFim, setCustomFim] = useState(() => toInputDate(new Date()))
  const [buscaAtiva, setBuscaAtiva] = useState({ inicio: customInicio, fim: customFim })

  const queryParams =
    periodo === "personalizado"
      ? `inicio=${buscaAtiva.inicio}&fim=${buscaAtiva.fim}`
      : `periodo=${periodo}`

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["aniversarios", queryParams],
    queryFn: () => fetch(`/api/aniversarios?${queryParams}`).then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cake className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aniversários</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total != null ? `${data.total} aniversariante${data.total !== 1 ? "s" : ""} no período` : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Tabs
          value={periodo}
          onValueChange={(v) => setPeriodo(v as Periodo)}
        >
          <TabsList>
            <TabsTrigger value="semana">Última semana</TabsTrigger>
            <TabsTrigger value="ultima-sessao">Desde última sessão</TabsTrigger>
            <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {periodo === "ultima-sessao" && data?.ultimaSessao && (
        <p className="text-sm text-muted-foreground -mt-2">
          Desde a sessão de {formatarData(data.ultimaSessao.data)} até hoje
        </p>
      )}

      <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Legenda de aniversários</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <span>• Irmão</span>
          <span>• Iniciação</span>
          <span>• Elevação</span>
          <span>• Exaltação</span>
          <span>• Regularização</span>
          <span>• Instalação</span>
          <span>• Casamento</span>
          <span>• Cônjuge</span>
          <span>• Filho/a</span>
        </div>
      </div>

      {periodo === "personalizado" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">De</span>
            <Input
              type="date"
              value={customInicio}
              onChange={(e) => setCustomInicio(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">até</span>
            <Input
              type="date"
              value={customFim}
              onChange={(e) => setCustomFim(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            size="sm"
            onClick={() => setBuscaAtiva({ inicio: customInicio, fim: customFim })}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data?.aniversariantes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Cake className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhum aniversário no período selecionado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data?.aniversariantes.map((a, i) => {
            const cfg = TIPO_CONFIG[a.tipo]
            const Icon = cfg.icon
            const diaMes = new Date(a.aniversario).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              timeZone: "UTC",
            })
            return (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium break-words">{a.nome}</div>
                        {a.contexto && (
                          <div className="text-xs text-muted-foreground break-words">
                            {a.tipo === "CONJUGE" ? "Cônjuge de" : "Filho/a de"} {a.contexto}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:shrink-0 pl-13 sm:pl-0">
                      <div className="text-sm font-medium capitalize">{diaMes}</div>
                      <div className="text-xs text-muted-foreground">{a.idade} anos</div>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
