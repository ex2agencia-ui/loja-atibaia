"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type Acao = "baixa" | "acordo" | "isencao" | "reabrir"

type Mensalidade = {
  id: string
  competencia: string
  valor: number | string
  valorTotal: number | string
  vencimento: string
  status: string
  isento: boolean
}

type Props = {
  mensalidade: Mensalidade | null
  acao: Acao | null
  membroNome: string
  onClose: () => void
  invalidateKey: unknown[]
}

const ACAO_CONFIG: Record<Acao, { titulo: string; descricao: string; cor: string }> = {
  baixa:   { titulo: "Dar Baixa",    descricao: "Registrar pagamento manual",       cor: "bg-green-600 hover:bg-green-700" },
  acordo:  { titulo: "Registrar Acordo", descricao: "Negociar valor e vencimento",  cor: "bg-blue-600 hover:bg-blue-700" },
  isencao: { titulo: "Isentar",      descricao: "Cancelar cobrança desta competência", cor: "bg-slate-600 hover:bg-slate-700" },
  reabrir: { titulo: "Reabrir",      descricao: "Voltar para pendente",             cor: "bg-orange-600 hover:bg-orange-700" },
}

export function AcaoMensalidadeDialog({ mensalidade, acao, membroNome, onClose, invalidateKey }: Props) {
  const queryClient = useQueryClient()
  const [pagamento, setPagamento] = useState(new Date().toISOString().slice(0, 10))
  const [novoValor, setNovoValor] = useState(String(mensalidade?.valorTotal ?? ""))
  const [novoVencimento, setNovoVencimento] = useState(
    mensalidade?.vencimento ? new Date(mensalidade.vencimento).toISOString().slice(0, 10) : ""
  )
  const [motivo, setMotivo] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/financeiro/mensalidades/${mensalidade?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!mensalidade || !acao) return null

  const cfg = ACAO_CONFIG[acao]

  const handleConfirmar = () => {
    if (acao === "baixa") {
      mutate({ acao: "baixa", pagamento, motivo })
    } else if (acao === "acordo") {
      mutate({ acao: "acordo", valor: Number(novoValor), vencimento: novoVencimento, motivo })
    } else if (acao === "isencao") {
      mutate({ acao: "isencao", motivo })
    } else if (acao === "reabrir") {
      mutate({ acao: "reabrir", motivo })
    }
  }

  const competenciaFormatada = (() => {
    const [ano, mes] = mensalidade.competencia.split("-")
    return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  })()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cfg.titulo}</DialogTitle>
          <p className="text-sm text-slate-500">
            {membroNome} — {competenciaFormatada}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {acao === "baixa" && (
            <div className="grid gap-1.5">
              <Label htmlFor="data-pagamento">Data do pagamento</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
              />
            </div>
          )}

          {acao === "acordo" && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="novo-valor">Novo valor (R$)</Label>
                <Input
                  id="novo-valor"
                  type="number"
                  min={0}
                  step={0.01}
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="novo-vencimento">Novo vencimento</Label>
                <Input
                  id="novo-vencimento"
                  type="date"
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="motivo">
              {acao === "isencao" ? "Motivo da isenção" : "Observação"}{" "}
              {acao !== "isencao" && <span className="text-slate-400">(opcional)</span>}
            </Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={acao === "isencao" ? "Ex.: membro em situação especial" : ""}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button
            className={cfg.cor + " text-white"}
            onClick={handleConfirmar}
            disabled={isPending || (acao === "isencao" && !motivo.trim())}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
