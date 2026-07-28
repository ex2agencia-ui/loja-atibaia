"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Briefcase, Phone, Mail, Building2, Trash2, Globe, MapPin, MessageCircle, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NovoClassificadoDialog } from "@/components/classificados/novo-classificado-dialog"
import { CATEGORIA_CONFIG, CategoriaKey } from "@/components/classificados/categoria-config"
import { toast } from "sonner"
import { formatarData } from "@/lib/utils/format"

type Classificado = {
  id: string
  titulo: string
  descricao: string
  categoria: CategoriaKey
  contato: string | null
  expiresAt: string | null
  createdAt: string
  member: {
    id: string
    nome: string
    empresa: string | null
    ramoAtuacao: string | null
    telefone: string | null
    email: string | null
    ocupacao: string | null
  }
}

function ClassificadoCard({ item, memberId, isPrivileged, onDelete }: {
  item: Classificado
  memberId?: string | null
  isPrivileged?: boolean
  onDelete: (id: string) => void
}) {
  const cfg = CATEGORIA_CONFIG[item.categoria]
  const Icon = cfg.icon
  const isOwner = item.member.id === memberId

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col gap-3 p-5 h-full">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
          {(isOwner || isPrivileged) && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-base leading-snug">{item.titulo}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{item.descricao}</p>
        </div>

        <div className="border-t pt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span>{item.member.nome}</span>
          </div>
          {item.member.empresa && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {item.member.empresa}
              {item.member.ramoAtuacao && <span className="text-muted-foreground/60">· {item.member.ramoAtuacao}</span>}
            </div>
          )}
          {item.contato && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />{item.contato}
            </div>
          )}
          {!item.contato && item.member.telefone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />{item.member.telefone}
            </div>
          )}
        </div>

        {item.expiresAt && (
          <p className="text-xs text-muted-foreground">Válido até {formatarData(item.expiresAt)}</p>
        )}
      </CardContent>
    </Card>
  )
}

type MembroProfissional = {
  id: string
  nome: string
  ocupacao: string | null
  empresa: string | null
  ramoAtuacao: string | null
  site: string | null
  linkedin: string | null
  telefone: string | null
  isWhatsapp: boolean
  email: string | null
  notasOcupacao: string | null
  cidade: string | null
  bairro: string | null
}

function Initials({ nome }: { nome: string }) {
  return (
    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
      {nome.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
    </div>
  )
}

function PerfilDetalheDialog({ member, open, onClose }: { member: MembroProfissional; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil profissional</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-center gap-4">
            <Initials nome={member.nome} />
            <div>
              <div className="font-semibold text-base leading-tight">{member.nome}</div>
              {member.ocupacao && <div className="text-sm text-muted-foreground">{member.ocupacao}</div>}
              {member.cidade && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />{member.cidade}{member.bairro ? ` · ${member.bairro}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Empresa */}
          {(member.empresa || member.ramoAtuacao) && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
              {member.empresa && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  {member.empresa}
                </div>
              )}
              {member.ramoAtuacao && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  {member.ramoAtuacao}
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {member.notasOcupacao && (
            <p className="text-sm text-muted-foreground">{member.notasOcupacao}</p>
          )}

          {/* Contato */}
          <div className="space-y-2">
            {member.telefone && (
              <a href={member.isWhatsapp ? `https://wa.me/55${member.telefone.replace(/\D/g, "")}` : `tel:${member.telefone}`}
                target={member.isWhatsapp ? "_blank" : undefined}
                className="flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors">
                {member.isWhatsapp
                  ? <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                  : <Phone className="h-4 w-4 text-muted-foreground shrink-0" />}
                {member.telefone}
                {member.isWhatsapp && <span className="text-xs text-green-600">WhatsApp</span>}
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                {member.email}
              </a>
            )}
            {member.site && (
              <a href={member.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                {member.site.replace(/^https?:\/\//, "")}
              </a>
            )}
            {member.linkedin && (
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PerfilCard({ member }: { member: MembroProfissional }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setOpen(true)}>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-3">
            <Initials nome={member.nome} />
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight truncate">{member.nome}</div>
              {member.ocupacao && <div className="text-xs text-muted-foreground truncate">{member.ocupacao}</div>}
            </div>
          </div>
          {member.empresa && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{member.empresa}</span>
            </div>
          )}
          {member.ramoAtuacao && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{member.ramoAtuacao}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            {member.telefone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {member.isWhatsapp ? <MessageCircle className="h-3.5 w-3.5 text-green-500" /> : <Phone className="h-3.5 w-3.5" />}
                {member.telefone}
              </span>
            )}
            {member.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{member.email}</span>
              </span>
            )}
          </div>
          <div className="text-xs text-indigo-600 font-medium pt-0.5">Ver detalhes →</div>
        </CardContent>
      </Card>
      <PerfilDetalheDialog member={member} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const CATEGORIAS = Object.entries(CATEGORIA_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))

export default function ClassificadosPage() {
  const [search, setSearch] = useState("")
  const [categoria, setCategoria] = useState("")
  const [tab, setTab] = useState<"anuncios" | "profissionais">("anuncios")
  const qc = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then(r => r.json()),
    staleTime: 60_000,
  })

  const params = new URLSearchParams()
  if (categoria) params.set("categoria", categoria)
  if (search) params.set("search", search)

  const { data: classificados = [], isLoading } = useQuery({
    queryKey: ["classificados", categoria, search],
    queryFn: () => fetch(`/api/classificados?${params}`).then(r => r.json()),
  })

  // Perfis profissionais: membros com empresa ou ramoAtuacao preenchidos
  const { data: membrosProf = [] } = useQuery({
    queryKey: ["membros-profissionais", search],
    queryFn: () => fetch(`/api/membros?situacao=ATIVO${search ? `&search=${search}` : ""}&limit=200`).then(r => r.json()).then(d => (d.members ?? []).filter((m: any) => m.empresa || m.ramoAtuacao || m.ocupacao)),
    enabled: tab === "profissionais",
  })

  async function handleDelete(id: string) {
    if (!confirm("Remover este anúncio?")) return
    const res = await fetch(`/api/classificados/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Anúncio removido")
      qc.invalidateQueries({ queryKey: ["classificados"] })
    } else {
      toast.error("Erro ao remover")
    }
  }

  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(me?.role)
  const hasMembro = !!me?.memberId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classificados</h1>
          <p className="text-sm text-muted-foreground">Serviços e oportunidades dos irmãos</p>
        </div>
        {hasMembro && (
          <NovoClassificadoDialog onCreated={() => qc.invalidateQueries({ queryKey: ["classificados"] })} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["anuncios", "profissionais"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "anuncios" ? "Anúncios" : "Diretório Profissional"}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, nome ou ramo..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {tab === "anuncios" && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoria("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!categoria ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"}`}
            >
              Todos
            </button>
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                onClick={() => setCategoria(c.value === categoria ? "" : c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoria === c.value ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {tab === "anuncios" ? (
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : classificados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum anúncio encontrado.</p>
            {hasMembro && <p className="text-sm mt-1">Seja o primeiro a publicar!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classificados.map((item: Classificado) => (
              <ClassificadoCard
                key={item.id}
                item={item}
                memberId={me?.memberId}
                isPrivileged={isPrivileged}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        membrosProf.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum irmão com dados profissionais cadastrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {membrosProf.map((m: MembroProfissional) => (
              <PerfilCard key={m.id} member={m} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
