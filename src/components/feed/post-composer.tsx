"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ImageUploader } from "./image-uploader"
import { CATEGORIA_CONFIG } from "@/components/classificados/categoria-config"
import { Loader2, Tag } from "lucide-react"
import { toast } from "sonner"

const CATEGORIAS = Object.entries(CATEGORIA_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))

type Props = {
  onCreated: (post: any) => void
  defaultAnuncio?: boolean
  membroNome?: string
}

export function PostComposer({ onCreated, defaultAnuncio = false, membroNome }: Props) {
  const [texto, setTexto] = useState("")
  const [imagens, setImagens] = useState<string[]>([])
  const [isAnuncio, setIsAnuncio] = useState(defaultAnuncio)
  const [titulo, setTitulo] = useState("")
  const [categoria, setCategoria] = useState("SERVICO")
  const [contato, setContato] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: isAnuncio ? "CLASSIFICADO" : "FEED",
          texto,
          imagens,
          ...(isAnuncio ? {
            titulo: titulo || null,
            categoria,
            contato: contato || null,
            expiresAt: expiresAt || null,
          } : {}),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error?.formErrors?.[0] ?? "Erro ao publicar")
        return
      }
      const post = await res.json()
      toast.success(isAnuncio ? "Anúncio publicado!" : "Publicado!")
      onCreated(post)
      setTexto("")
      setImagens([])
      setTitulo("")
      setContato("")
      setExpiresAt("")
      setIsAnuncio(defaultAnuncio)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
          {membroNome ? membroNome.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() : "?"}
        </div>
        <Textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder={isAnuncio ? "Descreva seu produto, serviço ou oportunidade..." : "Compartilhe algo com a Loja..."}
          rows={texto.length > 80 ? 4 : 2}
          className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {isAnuncio && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <Input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Título do anúncio (opcional)"
            className="text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${categoria === c.value ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={contato} onChange={e => setContato(e.target.value)} placeholder="Contato específico" className="text-sm" />
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="text-sm" />
          </div>
        </div>
      )}

      <ImageUploader urls={imagens} onChange={setImagens} />

      <div className="flex items-center justify-between pt-1 border-t">
        <button
          type="button"
          onClick={() => setIsAnuncio(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${isAnuncio ? "bg-indigo-100 text-indigo-700" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Tag className="h-3.5 w-3.5" />
          Anúncio
        </button>
        <Button type="submit" size="sm" disabled={loading || !texto.trim()}>
          {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Publicar
        </Button>
      </div>
    </form>
  )
}
