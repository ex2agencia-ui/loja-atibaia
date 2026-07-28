"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/feed/image-uploader"
import { toast } from "sonner"
import { Loader2, Users, User, Newspaper, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NovoComunicadoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [texto, setTexto] = useState("")
  const [imagens, setImagens] = useState<string[]>([])
  const [noFeed, setNoFeed] = useState(false)
  const [destinatarios, setDestinatarios] = useState<"todos" | "selecionar">("todos")
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { data: membrosData } = useQuery({
    queryKey: ["membros-ativos"],
    queryFn: () => fetch("/api/membros?situacao=ATIVO&limit=300").then(r => r.json()),
    enabled: destinatarios === "selecionar",
  })
  const membros: any[] = membrosData?.members ?? []

  function toggleMembro(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !texto.trim()) return
    if (destinatarios === "selecionar" && selecionados.length === 0) {
      toast.error("Selecione ao menos um destinatário")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, texto, imagens, noFeed, destinatarios, membrosIds: selecionados }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? "Erro ao enviar")
        return
      }
      toast.success("Comunicado enviado!")
      router.push("/comunicados")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/comunicados" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Comunicado</h1>
          <p className="text-sm text-muted-foreground">Envie uma mensagem para os irmãos</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Conteúdo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reunião extraordinária" required />
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem *</Label>
              <Textarea value={texto} onChange={e => setTexto(e.target.value)} rows={6} placeholder="Texto do comunicado..." required />
            </div>
            <div className="space-y-1.5">
              <Label>Imagens <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <ImageUploader urls={imagens} onChange={setImagens} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Destinatários</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDestinatarios("todos")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${destinatarios === "todos" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-border text-muted-foreground hover:border-indigo-200"}`}
              >
                <Users className="h-4 w-4" /> Todos os membros ativos
              </button>
              <button
                type="button"
                onClick={() => setDestinatarios("selecionar")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${destinatarios === "selecionar" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-border text-muted-foreground hover:border-indigo-200"}`}
              >
                <User className="h-4 w-4" /> Selecionar membros
              </button>
            </div>

            {destinatarios === "selecionar" && (
              <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                {membros.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">Carregando...</div>
                ) : membros.map((m: any) => (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(m.id)}
                      onChange={() => toggleMembro(m.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{m.nome}</span>
                    {m.posicao && <span className="text-xs text-muted-foreground">{m.posicao}</span>}
                  </label>
                ))}
              </div>
            )}

            {destinatarios === "selecionar" && selecionados.length > 0 && (
              <p className="text-xs text-muted-foreground">{selecionados.length} membro(s) selecionado(s)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={noFeed} onChange={e => setNoFeed(e.target.checked)} />
                <div className={`w-10 h-6 rounded-full transition-colors ${noFeed ? "bg-indigo-600" : "bg-muted-foreground/30"}`} />
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${noFeed ? "translate-x-4" : ""}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Newspaper className="h-4 w-4" /> Publicar também no Mural
                </div>
                <p className="text-xs text-muted-foreground">O comunicado aparecerá no feed de todos os membros</p>
              </div>
            </label>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Enviar Comunicado
        </Button>
      </form>
    </div>
  )
}
