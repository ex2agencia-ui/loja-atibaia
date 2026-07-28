"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bell, Plus, Users, CheckCheck, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"

type Comunicado = {
  id: string
  titulo: string
  texto: string
  imagens: string[]
  noFeed: boolean
  createdAt: string
  autor: { name: string | null; email: string; role: string }
  _count?: { destinatarios: number }
}

type Destinatario = {
  id: string
  lidoEm: string | null
  comunicado: Comunicado
}

function ComunicadoAdminCard({ c }: { c: Comunicado }) {
  return (
    <Link href={`/comunicados/${c.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{c.titulo}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.texto}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c._count?.destinatarios ?? 0} destinatários</span>
              {c.noFeed && <span className="text-indigo-600 font-medium">• No mural</span>}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
        </CardContent>
      </Card>
    </Link>
  )
}

function ComunicadoMembroCard({ dest, onLido }: { dest: Destinatario; onLido: (id: string) => void }) {
  const c = dest.comunicado
  const lido = !!dest.lidoEm
  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${!lido ? "border-indigo-200 bg-indigo-50/30" : ""}`}
      onClick={() => !lido && onLido(c.id)}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${lido ? "bg-muted text-muted-foreground" : "bg-indigo-100 text-indigo-700"}`}>
          {lido ? <CheckCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate ${!lido ? "font-semibold" : "font-medium"}`}>{c.titulo}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.texto}</p>
          <div className="mt-1.5 text-xs text-muted-foreground">
            De: {c.autor.name ?? c.autor.email}
            {!lido && <span className="ml-2 text-indigo-600 font-medium">• Não lido</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
      </CardContent>
    </Card>
  )
}

export default function ComunicadosPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["comunicados"],
    queryFn: () => fetch("/api/comunicados").then(r => r.json()),
  })

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then(r => r.json()),
    staleTime: 60_000,
  })

  const isAdmin = ["ADMIN", "SECRETARIO", "CHANCELARIA"].includes(me?.role)

  async function marcarLido(comunicadoId: string) {
    await fetch(`/api/comunicados/${comunicadoId}/lido`, { method: "POST" })
    qc.invalidateQueries({ queryKey: ["comunicados"] })
    qc.invalidateQueries({ queryKey: ["nao-lidos"] })
  }

  const comunicados: Comunicado[] = data?.isAdmin ? (data?.comunicados ?? []) : []
  const destinatarios: Destinatario[] = !data?.isAdmin ? (data?.comunicados ?? []) : []
  const naoLidos = destinatarios.filter(d => !d.lidoEm).length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Comunicados enviados pela administração" : naoLidos > 0 ? `${naoLidos} não lido(s)` : "Seus comunicados"}
          </p>
        </div>
        {isAdmin && (
          <Link href="/comunicados/novo" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isAdmin ? (
        comunicados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            Nenhum comunicado enviado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {comunicados.map(c => <ComunicadoAdminCard key={c.id} c={c} />)}
          </div>
        )
      ) : (
        destinatarios.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            Nenhum comunicado recebido.
          </div>
        ) : (
          <div className="space-y-3">
            {destinatarios.map(d => (
              <ComunicadoMembroCard key={d.id} dest={d} onLido={marcarLido} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
