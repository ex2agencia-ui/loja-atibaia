"use client"

import { useState, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, TrendingDown, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIAS = [
  { value: "MENSALIDADE",           label: "Mensalidade" },
  { value: "TRONCO_SOLIDARIEDADE",  label: "Tronco de Solidariedade" },
  { value: "TAXA_GRAU",             label: "Taxa de Grau" },
  { value: "DOACAO",                label: "Doação" },
  { value: "MANUTENCAO_TEMPLO",     label: "Manutenção do Templo" },
  { value: "AGAPE",                 label: "Ágape" },
  { value: "REPASSE_POTENCIA",      label: "Repasse à Potência" },
  { value: "OUTROS",                label: "Outros" },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function NovoLancamentoSheet({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("RECEITA")
  const [categoria, setCategoria] = useState("")
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [membroId, setMembroId] = useState("")
  const [comprovanteUrl, setComprovanteUrl] = useState("")
  const [comprovanteNome, setComprovanteNome] = useState("")
  const [uploadando, setUploadando] = useState(false)
  const [erro, setErro] = useState("")

  const { data: membros } = useQuery<{ id: string; nome: string; cim: string }[]>({
    queryKey: ["membros-select"],
    queryFn: () =>
      fetch("/api/membros?situacao=ATIVO&limit=200").then((r) => r.json()).then((d) => d.members ?? []),
  })

  const { mutate: salvar, isPending } = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { setErro(res.error); return }
      queryClient.invalidateQueries({ queryKey: ["caixa"] })
      handleClose()
    },
  })

  const handleClose = () => {
    setTipo("RECEITA")
    setCategoria("")
    setDescricao("")
    setValor("")
    setData(new Date().toISOString().slice(0, 10))
    setMembroId("")
    setComprovanteUrl("")
    setComprovanteNome("")
    setErro("")
    onClose()
  }

  const handleUpload = async (file: File) => {
    setUploadando(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (data.url) {
        setComprovanteUrl(data.url)
        setComprovanteNome(file.name)
      } else {
        setErro("Falha no upload do comprovante")
      }
    } catch {
      setErro("Falha no upload do comprovante")
    } finally {
      setUploadando(false)
    }
  }

  const handleSubmit = () => {
    setErro("")
    if (!categoria) { setErro("Selecione uma categoria"); return }
    if (!descricao.trim()) { setErro("Informe a descrição"); return }
    const valorNum = parseFloat(valor.replace(",", "."))
    if (!valorNum || valorNum <= 0) { setErro("Informe um valor válido"); return }

    salvar({
      tipo,
      categoria,
      descricao: descricao.trim(),
      valor: valorNum,
      data,
      memberId: membroId || null,
      comprovanteUrl: comprovanteUrl || null,
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Lançamento</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Tipo: RECEITA / DESPESA */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("RECEITA")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-colors",
                tipo === "RECEITA"
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-slate-200 text-slate-500 hover:border-green-300 hover:text-green-700"
              )}
            >
              <TrendingUp className="h-4 w-4" /> Receita
            </button>
            <button
              type="button"
              onClick={() => setTipo("DESPESA")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-colors",
                tipo === "DESPESA"
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-700"
              )}
            >
              <TrendingDown className="h-4 w-4" /> Despesa
            </button>
          </div>

          {/* Categoria */}
          <div className="grid gap-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="grid gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o lançamento..."
              rows={2}
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                min={0}
                step={0.01}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data-lancamento">Data</Label>
              <Input
                id="data-lancamento"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>

          {/* Membro vinculado (opcional) */}
          <div className="grid gap-1.5">
            <Label>Membro vinculado <span className="text-slate-400 font-normal">(opcional)</span></Label>
            <Select value={membroId} onValueChange={(v) => setMembroId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {(membros ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome} · {m.cim}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comprovante */}
          <div className="grid gap-1.5">
            <Label>Comprovante <span className="text-slate-400 font-normal">(opcional)</span></Label>
            {comprovanteUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 flex-1 truncate">{comprovanteNome}</span>
                <button
                  type="button"
                  onClick={() => { setComprovanteUrl(""); setComprovanteNome("") }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-slate-600"
                  disabled={uploadando}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadando
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Paperclip className="h-4 w-4" />
                  }
                  {uploadando ? "Enviando..." : "Anexar comprovante"}
                </Button>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || uploadando}
            className={tipo === "RECEITA" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar {tipo === "RECEITA" ? "receita" : "despesa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
