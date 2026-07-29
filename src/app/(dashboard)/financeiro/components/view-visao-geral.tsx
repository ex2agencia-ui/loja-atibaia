"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Mail,
  Bell,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type MensalidadeItem = {
  id: string
  competencia: string
  status: string
  isento: boolean
  valorTotal: number
  vencimento: string
  pagamento: string | null
}

type MembroVisao = {
  id: string
  nome: string
  cim: string
  posicao: string
  email: string | null
  vencidas: number
  pendentes: number
  totalAberto: number
  mensalidadesVencidas: MensalidadeItem[]
}

type VisaoGeralData = {
  membros: MembroVisao[]
  total: number
}

function formatBRL(v: number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatComp(comp: string) {
  const [ano, mes] = comp.split("-")
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

// ── Modal de cobrança ─────────────────────────────────────────────────────────

function CobrancaModal({
  membro,
  selecionados,
  onClose,
  onSuccess,
}: {
  membro: MembroVisao
  selecionados: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [canal, setCanal] = useState<"email" | "comunicado">("comunicado")
  const [enviando, setEnviando] = useState(false)

  const totalSelecionado = (membro.mensalidadesVencidas ?? [])
    .filter(m => selecionados.includes(m.id))
    .reduce((acc, m) => acc + m.valorTotal, 0)

  async function enviar() {
    setEnviando(true)
    try {
      const res = await fetch("/api/financeiro/cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal, memberId: membro.id, mensalidadeIds: selecionados }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar")
      toast.success(canal === "email" ? `Email enviado para ${data.destinatario}` : "Comunicado enviado")
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar cobrança")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-600" />
            Enviar cobrança — {membro.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo dos itens */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            {(membro.mensalidadesVencidas ?? [])
              .filter(m => selecionados.includes(m.id))
              .map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 capitalize">{formatComp(m.competencia)}</span>
                  <span className="font-medium text-red-700">{formatBRL(m.valorTotal)}</span>
                </div>
              ))}
            <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-red-700">{formatBRL(totalSelecionado)}</span>
            </div>
          </div>

          {/* Canal */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Canal de envio</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCanal("comunicado")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  canal === "comunicado"
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Bell className="h-4 w-4" />
                Comunicado
              </button>
              <button
                type="button"
                onClick={() => setCanal("email")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  canal === "email"
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
            {canal === "email" && !membro.email && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Este membro não tem email cadastrado.
              </p>
            )}
            {canal === "comunicado" && (
              <p className="text-xs text-slate-400">
                O membro receberá uma notificação no sistema com os detalhes e chave PIX.
              </p>
            )}
            {canal === "email" && membro.email && (
              <p className="text-xs text-slate-400">
                Será enviado para <span className="font-medium">{membro.email}</span>.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={enviando}>Cancelar</Button>
          <Button
            onClick={enviar}
            disabled={enviando || (canal === "email" && !membro.email)}
          >
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Linha de membro ───────────────────────────────────────────────────────────

function MembroRow({
  membro,
  onVerExtrato,
}: {
  membro: MembroVisao
  onVerExtrato: (id: string) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [showCobranca, setShowCobranca] = useState(false)

  const temVencidas = membro.vencidas > 0
  const vencidas = membro.mensalidadesVencidas ?? []

  function toggleItem(id: string) {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (selecionados.length === vencidas.length) {
      setSelecionados([])
    } else {
      setSelecionados(vencidas.map(m => m.id))
    }
  }

  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      temVencidas ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white"
    )}>
      {/* Linha principal */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{membro.nome}</span>
            <span className="text-xs text-slate-400">{membro.cim}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {temVencidas ? (
              <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {membro.vencidas} vencida{membro.vencidas > 1 ? "s" : ""} · {formatBRL(membro.totalAberto)}
              </span>
            ) : (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Em dia
              </span>
            )}
            {membro.pendentes > 0 && (
              <span className="text-xs text-yellow-600">
                · {membro.pendentes} pendente{membro.pendentes > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => onVerExtrato(membro.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Extrato
          </Button>
          {temVencidas && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-100"
              onClick={() => setExpandido(e => !e)}
            >
              {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expandido ? "Fechar" : "Detalhes"}
            </Button>
          )}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expandido && (
        <div className="border-t border-red-100 px-4 py-3 space-y-2 bg-white rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`todos-${membro.id}`}
                checked={vencidas.length > 0 && selecionados.length === vencidas.length}
                onChange={toggleTodos}
                className="rounded"
              />
              <label htmlFor={`todos-${membro.id}`} className="text-xs text-slate-500 cursor-pointer">
                Selecionar todos
              </label>
            </div>
            {selecionados.length > 0 && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setShowCobranca(true)}
              >
                <Send className="h-3 w-3 mr-1.5" />
                Cobrar {selecionados.length} item{selecionados.length > 1 ? "s" : ""}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            {vencidas.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-md border border-red-100 bg-red-50 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(m.id)}
                  onChange={() => toggleItem(m.id)}
                  className="rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 capitalize">
                    {formatComp(m.competencia)}
                  </p>
                  <p className="text-xs text-red-500">
                    Venceu em {formatData(m.vencimento)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-red-700">{formatBRL(m.valorTotal)}</p>
                  <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-red-200">
                    Vencido
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50 shrink-0"
                  onClick={() => { setSelecionados([m.id]); setShowCobranca(true) }}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCobranca && (
        <CobrancaModal
          membro={membro}
          selecionados={selecionados}
          onClose={() => setShowCobranca(false)}
          onSuccess={() => { setShowCobranca(false); setSelecionados([]) }}
        />
      )}
    </div>
  )
}

// ── View principal ────────────────────────────────────────────────────────────

export function ViewVisaoGeral({ onVerExtrato }: { onVerExtrato: (id: string) => void }) {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "inadimplente" | "pendente" | "emdia">("inadimplente")

  const { data, isLoading } = useQuery<VisaoGeralData>({
    queryKey: ["visao-geral-mensalidades"],
    queryFn: () => fetch("/api/financeiro/mensalidades/visao-geral").then(r => r.json()),
    staleTime: 60_000,
  })

  const membros = (data?.membros ?? []).filter(m => {
    const matchBusca = !busca ||
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.cim.includes(busca)
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "inadimplente" && m.vencidas > 0) ||
      (filtroStatus === "pendente" && m.pendentes > 0 && m.vencidas === 0) ||
      (filtroStatus === "emdia" && m.vencidas === 0 && m.pendentes === 0)
    return matchBusca && matchStatus
  })

  const totalInadimplentes = (data?.membros ?? []).filter(m => m.vencidas > 0).length
  const totalEmDia = (data?.membros ?? []).filter(m => m.vencidas === 0 && m.pendentes === 0).length

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-8 h-9"
            placeholder="Buscar por nome ou CIM..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <Select value={filtroStatus} onValueChange={v => v && setFiltroStatus(v as typeof filtroStatus)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inadimplente">Inadimplentes</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="emdia">Em dia</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>

        {/* Resumo rápido */}
        <div className="flex items-center gap-2 ml-auto">
          {totalInadimplentes > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {totalInadimplentes} inadimplente{totalInadimplentes > 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {totalEmDia} em dia
          </Badge>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : membros.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          {busca || filtroStatus !== "todos"
            ? "Nenhum membro encontrado com esses filtros."
            : "Nenhum membro ativo encontrado."
          }
        </div>
      ) : (
        <div className="space-y-2">
          {membros.map(m => (
            <MembroRow key={m.id} membro={m} onVerExtrato={onVerExtrato} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        {membros.length} membro{membros.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
