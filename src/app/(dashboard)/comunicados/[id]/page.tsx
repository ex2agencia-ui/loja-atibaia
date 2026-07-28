"use client"

import { use } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Bell, Users, Newspaper, Trash2, CheckCheck, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", SECRETARIO: "Secretário",
  CHANCELARIA: "Chancelaria", FINANCEIRO: "Financeiro", MEMBRO: "Membro",
}

export default function ComunicadoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then(r => r.json()),
    staleTime: 60_000,
  })

  const { data: comunicado, isLoading } = useQuery({
    queryKey: ["comunicado", id],
    queryFn: () => fetch(`/api/comunicados/${id}`).then(r => r.json()),
  })

  const isAdmin = ["ADMIN", "SECRETARIO", "CHANCELARIA"].includes(me?.role)
  const lidos = comunicado?.destinatarios?.filter((d: any) => d.lidoEm).length ?? 0
  const total = comunicado?.destinatarios?.length ?? 0

  async function handleDelete() {
    if (!confirm("Remover este comunicado?")) return
    const res = await fetch(`/api/comunicados/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Comunicado removido")
      qc.invalidateQueries({ queryKey: ["comunicados"] })
      router.push("/comunicados")
    } else {
      toast.error("Erro ao remover")
    }
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!comunicado || comunicado.error) return (
    <div className="text-center py-20 text-muted-foreground">Comunicado não encontrado.</div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comunicados" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight flex-1 truncate">{comunicado.titulo}</h1>
        {isAdmin && (
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Meta */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{comunicado.autor.name ?? comunicado.autor.email}</div>
              <div className="text-xs text-muted-foreground">
                {ROLE_LABELS[comunicado.autor.role] ?? comunicado.autor.role}
                {" · "}
                {format(new Date(comunicado.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {total} destinatário(s)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCheck className="h-3.5 w-3.5 text-green-500" /> {lidos} lido(s)
            </span>
            {comunicado.noFeed && (
              <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <Newspaper className="h-3.5 w-3.5" /> Publicado no mural
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{comunicado.texto}</p>
          {comunicado.imagens?.length > 0 && (
            <div className={`mt-4 grid gap-2 ${comunicado.imagens.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {comunicado.imagens.map((url: string) => (
                <img key={url} src={url} alt="" className="rounded-lg object-cover w-full aspect-video" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destinatários (só admin vê) */}
      {isAdmin && comunicado.destinatarios?.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Destinatários</h3>
            <div className="divide-y max-h-64 overflow-y-auto">
              {comunicado.destinatarios.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{d.member.nome}</span>
                  {d.lidoEm ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(d.lidoEm), { addSuffix: true, locale: ptBR })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Não lido
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
