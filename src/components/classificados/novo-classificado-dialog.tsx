"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { CATEGORIA_CONFIG } from "@/components/classificados/categoria-config"

const CATEGORIAS = Object.entries(CATEGORIA_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))

type FormState = {
  titulo: string
  descricao: string
  categoria: string
  contato: string
  expiresAt: string
}

export function NovoClassificadoDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    titulo: "",
    descricao: "",
    categoria: "SERVICO",
    contato: "",
    expiresAt: "",
  })

  function update(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/classificados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao,
          categoria: form.categoria,
          contato: form.contato || null,
          expiresAt: form.expiresAt || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error?.formErrors?.[0] ?? "Erro ao publicar anúncio")
        return
      }
      toast.success("Anúncio publicado!")
      setOpen(false)
      setForm({ titulo: "", descricao: "", categoria: "SERVICO", contato: "", expiresAt: "" })
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" /> Publicar anúncio</Button>} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo anúncio</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update("categoria", c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.categoria === c.value ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.titulo}
              onChange={e => update("titulo", e.target.value)}
              placeholder="Ex: Consultoria jurídica em direito trabalhista"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea
              value={form.descricao}
              onChange={e => update("descricao", e.target.value)}
              placeholder="Descreva o que você oferece, procura ou quer anunciar..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contato <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                value={form.contato}
                onChange={e => update("contato", e.target.value)}
                placeholder="Tel ou email específico"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Válido até <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={e => update("expiresAt", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publicar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
