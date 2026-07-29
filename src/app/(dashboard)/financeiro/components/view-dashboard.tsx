"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  CheckCircle2, MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Kpis = {
  arrecadadoMes: number
  pendenteMes: number
  saldoCaixa: number
  taxaInadimplencia: number
  inadimplentesTotal: number
  totalMembrosAtivos: number
}

type HistoricoItem = {
  competencia: string
  label: string
  receitas: number
  despesas: number
}

type Inadimplente = {
  id: string
  nome: string
  cim: string
  telefone: string | null
  isWhatsapp: boolean
  mesesAtraso: number
  totalAberto: number
  competencias: string[]
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className={cn("rounded-xl border p-5 flex items-start gap-4", color)}>
      <div className="rounded-lg p-2 bg-white/40">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const TooltipBRL = ({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

function whatsappUrl(telefone: string, nome: string, totalAberto: number, meses: number) {
  const num = telefone.replace(/\D/g, "")
  const completo = num.startsWith("55") ? num : `55${num}`
  const msg = encodeURIComponent(
    `Olá, Ir. ${nome}! 🤝\nPassando para informar que há ${meses} mensalidade(s) em aberto totalizando ${formatBRL(totalAberto)}.\nQualquer dúvida, estou à disposição.`
  )
  return `https://wa.me/${completo}?text=${msg}`
}

export function ViewDashboard() {
  const { data: dash, isLoading: loadingDash } = useQuery<{ kpis: Kpis; historico: HistoricoItem[] }>({
    queryKey: ["financeiro-dashboard"],
    queryFn: () => fetch("/api/financeiro/dashboard").then((r) => r.json()),
    staleTime: 60_000,
  })

  const { data: inadData, isLoading: loadingInad } = useQuery<{ inadimplentes: Inadimplente[] }>({
    queryKey: ["financeiro-inadimplentes"],
    queryFn: () => fetch("/api/financeiro/inadimplentes").then((r) => r.json()),
    staleTime: 60_000,
  })

  const kpis = dash?.kpis
  const historico = dash?.historico ?? []
  const inadimplentes = inadData?.inadimplentes ?? []

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {loadingDash ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={CheckCircle2}
            label="Arrecadado no mês"
            value={formatBRL(kpis?.arrecadadoMes ?? 0)}
            sub="mensalidades pagas"
            color="bg-green-50 border-green-200 text-green-800"
          />
          <KpiCard
            icon={TrendingDown}
            label="Pendente / Em aberto"
            value={formatBRL(kpis?.pendenteMes ?? 0)}
            sub="mensalidades do mês"
            color="bg-yellow-50 border-yellow-200 text-yellow-800"
          />
          <KpiCard
            icon={Wallet}
            label="Saldo de caixa"
            value={formatBRL(kpis?.saldoCaixa ?? 0)}
            sub="receitas − despesas do mês"
            color={
              (kpis?.saldoCaixa ?? 0) >= 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                : "bg-orange-50 border-orange-200 text-orange-800"
            }
          />
          <KpiCard
            icon={AlertTriangle}
            label="Taxa de inadimplência"
            value={`${kpis?.taxaInadimplencia ?? 0}%`}
            sub={`${kpis?.inadimplentesTotal ?? 0} de ${kpis?.totalMembrosAtivos ?? 0} membros`}
            color={
              (kpis?.taxaInadimplencia ?? 0) > 20
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }
          />
        </div>
      )}

      {/* Gráfico histórico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Receitas vs. Despesas — últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDash ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : historico.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              Nenhum dado histórico disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  width={52}
                />
                <Tooltip content={<TooltipBRL />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela de inadimplentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Inadimplentes
            {inadimplentes.length > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-1">
                {inadimplentes.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingInad ? (
            <div className="space-y-px px-4 pb-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : inadimplentes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-300" />
              Nenhum inadimplente no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[2fr_80px_120px_120px] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <span>Membro</span>
                <span className="text-center">Meses</span>
                <span className="text-right">Total em aberto</span>
                <span className="text-right">Contato</span>
              </div>
              {inadimplentes.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[2fr_80px_120px_120px] gap-3 px-4 py-3 items-center hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.nome}</p>
                    <p className="text-xs text-slate-400">{m.cim}</p>
                  </div>
                  <div className="flex justify-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold",
                        m.mesesAtraso >= 3
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      )}
                    >
                      {m.mesesAtraso}×
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-red-700 text-right">
                    {formatBRL(m.totalAberto)}
                  </p>
                  <div className="flex justify-end">
                    {m.telefone && m.isWhatsapp ? (
                      <a
                        href={whatsappUrl(m.telefone, m.nome, m.totalAberto, m.mesesAtraso)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">sem WhatsApp</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
