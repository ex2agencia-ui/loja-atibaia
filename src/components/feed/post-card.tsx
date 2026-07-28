"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ReacoesBar } from "./reacoes-bar"
import { ImageUploader } from "./image-uploader"
import { CATEGORIA_CONFIG, CategoriaKey } from "@/components/classificados/categoria-config"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageCircle, Trash2, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"

type Reacao = { id: string; emoji: string; memberId: string }
type Member = { id: string; nome: string; ocupacao?: string | null; empresa?: string | null }

type Comentario = {
  id: string
  texto: string
  imagens: string[]
  createdAt: string
  member: Member
  reacoes: Reacao[]
}

export type Post = {
  id: string
  tipo: "FEED" | "CLASSIFICADO"
  texto: string
  imagens: string[]
  titulo?: string | null
  categoria?: CategoriaKey | null
  contato?: string | null
  expiresAt?: string | null
  createdAt: string
  member: Member
  reacoes: Reacao[]
  _count: { comentarios: number }
}

function Initials({ nome }: { nome: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0">
      {nome.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
    </div>
  )
}

function ComentarioCard({ c, meuMemberId, isPrivileged, onDelete }: {
  c: Comentario
  meuMemberId?: string | null
  isPrivileged?: boolean
  onDelete: (id: string) => void
}) {
  const isOwner = c.member.id === meuMemberId

  async function toggleReacao(emoji: string) {
    const res = await fetch(`/api/comentarios/${c.id}/reacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) toast.error("Erro ao reagir")
  }

  return (
    <div className="flex gap-2.5">
      <Initials nome={c.member.nome} />
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-xl px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{c.member.nome}</span>
            {(isOwner || isPrivileged) && (
              <button onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.texto}</p>
        </div>
        {c.imagens.length > 0 && (
          <div className={`mt-1.5 grid gap-1 ${c.imagens.length > 1 ? "grid-cols-2" : "grid-cols-1"} max-w-xs`}>
            {c.imagens.map(url => (
              <img key={url} src={url} alt="" className="rounded-lg object-cover aspect-video w-full" />
            ))}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
          <ReacoesBar reacoes={c.reacoes} meuMemberId={meuMemberId} onToggle={toggleReacao} compact />
        </div>
      </div>
    </div>
  )
}

type PostCardProps = {
  post: Post
  meuMemberId?: string | null
  isPrivileged?: boolean
  onDelete: (id: string) => void
  onPostUpdate: (updatedPost: Post) => void
}

export function PostCard({ post, meuMemberId, isPrivileged, onDelete, onPostUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [texto, setTexto] = useState("")
  const [imagens, setImagens] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const qc = useQueryClient()

  const isOwner = post.member.id === meuMemberId
  const cfg = post.categoria ? CATEGORIA_CONFIG[post.categoria] : null

  const { data: comentarios = [], refetch } = useQuery({
    queryKey: ["comentarios", post.id],
    queryFn: () => fetch(`/api/posts/${post.id}/comentarios`).then(r => r.json()),
    enabled: showComments,
  })

  async function toggleReacao(emoji: string) {
    const res = await fetch(`/api/posts/${post.id}/reacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) { toast.error("Erro ao reagir"); return }
    const { action } = await res.json()
    // optimistic update
    const reacoes = action === "added"
      ? [...post.reacoes, { id: Date.now().toString(), emoji, memberId: meuMemberId! }]
      : post.reacoes.filter(r => !(r.memberId === meuMemberId && r.emoji === emoji))
    onPostUpdate({ ...post, reacoes })
  }

  async function submitComentario(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, imagens }),
      })
      if (!res.ok) { toast.error("Erro ao comentar"); return }
      setTexto("")
      setImagens([])
      refetch()
      onPostUpdate({ ...post, _count: { comentarios: post._count.comentarios + 1 } })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteComentario(id: string) {
    if (!confirm("Remover comentário?")) return
    const res = await fetch(`/api/comentarios/${id}`, { method: "DELETE" })
    if (res.ok) {
      refetch()
      onPostUpdate({ ...post, _count: { comentarios: Math.max(0, post._count.comentarios - 1) } })
    } else {
      toast.error("Erro ao remover")
    }
  }

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Initials nome={post.member.nome} />
          <div>
            <div className="text-sm font-semibold leading-tight">{post.member.nome}</div>
            <div className="text-xs text-muted-foreground">
              {post.member.ocupacao ?? post.member.empresa ?? ""}
              {" · "}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cfg && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
              <cfg.icon className="h-3 w-3" />
              {cfg.label}
            </span>
          )}
          {(isOwner || isPrivileged) && (
            <button onClick={() => onDelete(post.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-3">
        {post.titulo && <div className="font-semibold text-base mb-1">{post.titulo}</div>}
        <p className="text-sm whitespace-pre-wrap break-words">{post.texto}</p>
        {post.contato && (
          <p className="text-xs text-muted-foreground mt-1">📞 {post.contato}</p>
        )}
      </div>

      {/* Imagens */}
      {post.imagens.length > 0 && (
        <div className={`grid gap-0.5 ${post.imagens.length === 1 ? "grid-cols-1" : post.imagens.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {post.imagens.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              className={`w-full object-cover ${post.imagens.length === 1 ? "max-h-80" : "aspect-square"} ${post.imagens.length === 3 && i === 0 ? "row-span-2" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Reações e botão de comentário */}
      <div className="px-4 py-2.5 border-t flex items-center justify-between gap-3">
        <ReacoesBar reacoes={post.reacoes} meuMemberId={meuMemberId} onToggle={toggleReacao} />
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post._count.comentarios > 0 && <span>{post._count.comentarios}</span>}
        </button>
      </div>

      {/* Comentários */}
      {showComments && (
        <div className="border-t px-4 py-3 space-y-3">
          {comentarios.map((c: Comentario) => (
            <ComentarioCard
              key={c.id}
              c={c}
              meuMemberId={meuMemberId}
              isPrivileged={isPrivileged}
              onDelete={deleteComentario}
            />
          ))}

          {meuMemberId && (
            <form onSubmit={submitComentario} className="flex gap-2 pt-1">
              <div className="flex-1 space-y-2">
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={1}
                  className="w-full rounded-xl border bg-muted px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComentario(e as any) }
                  }}
                />
                <ImageUploader urls={imagens} onChange={setImagens} max={2} />
              </div>
              <button
                type="submit"
                disabled={submitting || !texto.trim()}
                className="self-start mt-0.5 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
