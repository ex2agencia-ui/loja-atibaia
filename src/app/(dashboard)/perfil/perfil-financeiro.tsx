"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertTriangle, Wallet, Copy } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Mensalidade = {
  id: string
  competencia: string
  valorTotal: number
  vencimento: string
  pagamento: string | null
  status: string
  isento: boolean
}

type ConfigPix = {
  pixChave: string | null
  pixTipo: string | null
  pixBeneficiario: string | null
  mensalidadeValorPadrao: number
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatCompetencia(comp: string) {
  const [ano, mes] = comp.split("-")
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PAGO:      { label: "Pago",     class: "bg-green-100 text-green-800 border-green-200" },
  PENDENTE:  { label: "Pendente", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  VENCIDO:   { label: "Vencido",  class: "bg-red-100 text-red-800 border-red-200" },
  CANCELADO: { label: "Isento",   class: "bg-slate-100 text-slate-600 border-slate-200" },
}

const PIX_TIPO_LABEL: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail",
  telefone: "Telefone", aleatoria: "Chave aleatória",
}

export function PerfilFinanceiro({ memberId }: { memberId: string }) {
  const [copiado, setCopiado] = useState(false)

  const { data, isLoading } = useQuery<{
    mensalidades: Mensalidade[]
    totais: { totalInadimplente: number; vencidas: number; pendentes: number }
  }>({
    queryKey: ["meu-extrato", memberId],
    queryFn: () =>
      fetch(`/api/financeiro/mensalidades/membro/${memberId}`).then((r) => r.json()),
    staleTime: 60_000,
  })

  const { data: config } = useQuery<ConfigPix>({
    queryKey: ["financeiro-config-pix"],
    queryFn: () => fetch("/api/financeiro/config").then((r) => r.json()),
    staleTime: 300_000,
  })

  const mensalidades = data?.mensalidades ?? []
  const totais = data?.totais
  const temPendencia = (totais?.vencidas ?? 0) > 0 || (totais?.pendentes ?? 0) > 0
  const totalAberto = totais?.totalInadimplente ?? 0

  const copiarPix = () => {
    if (config?.pixChave) {
      navigator.clipboard.writeText(config.pixChave)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Status geral */}
      <div className={cn(
        "rounded-xl border p-4 flex items-center gap-3",
        temPendencia
          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
          : "bg-green-50 border-green-200 text-green-800"
      )}>
        {temPendencia
          ? <AlertTriangle className="h-5 w-5 shrink-0" />
          : <CheckCircle2 className="h-5 w-5 shrink-0" />
        }
        <div>
          <p className="font-semibold text-sm">
            {temPendencia
              ? `Pendências — ${formatBRL(totalAberto)} em aberto`
              : "Em dia — nenhuma pendência financeira"
            }
          </p>
          {temPendencia && (
            <p className="text-xs opacity-70 mt-0.5">
              Entre em contato com a tesouraria para regularizar sua situação.
            </p>
          )}
        </div>
      </div>

      {/* Tabela de mensalidades */}
      {mensalidades.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhuma mensalidade registrada ainda.
        </p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[1fr_100px_90px_90px] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-t-lg">
                <span>Competência</span>
                <span className="text-right">Valor</span>
                <span className="text-center">Vencimento</span>
                <span className="text-center">Status</span>
              </div>

              {mensalidades.map((m) => {
                const cfg = m.isento && m.status !== "PAGO"
                  ? STATUS_CONFIG.CANCELADO
                  : STATUS_CONFIG[m.status] ?? { label: m.status, class: "" }
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-[1fr_100px_90px_90px] gap-3 px-4 py-3 items-center"
                  >
                    <span className="text-sm text-slate-700 capitalize">
                      {formatCompetencia(m.competencia)}
                    </span>
                    <span className="text-sm font-medium text-slate-800 text-right">
                      {formatBRL(Number(m.valorTotal))}
                    </span>
                    <span className="text-xs text-slate-500 text-center">
                      {formatData(m.vencimento)}
                    </span>
                    <div className="flex justify-center">
                      <Badge variant="outline" className={cn("text-xs", cfg.class)}>
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como pagar — só exibe se há chave PIX configurada */}
      {config?.pixChave && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                <Wallet className="h-4 w-4 text-indigo-500" />
                Como pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                {config.pixBeneficiario && (
                  <p><span className="text-slate-400 text-xs">Beneficiário</span><br /><span className="font-medium">{config.pixBeneficiario}</span></p>
                )}
                {config.pixTipo && (
                  <p><span className="text-slate-400 text-xs">{PIX_TIPO_LABEL[config.pixTipo] ?? config.pixTipo}</span><br />
                    <span className="font-medium font-mono">{config.pixChave}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={copiarPix}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiado ? "Chave copiada!" : "Copiar chave PIX"}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Após o pagamento, informe o comprovante à tesouraria para dar baixa.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
