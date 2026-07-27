"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, RotateCcw, Pencil } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIO: "Secretário",
  CHANCELARIA: "Chancelaria",
  FINANCEIRO: "Financeiro",
  MEMBRO: "Membro",
}

const ROLES = Object.keys(ROLE_LABELS)

type UsuarioItem = {
  id: string
  name: string | null
  email: string
  role: string
  mustChangePassword: boolean
  memberId: string | null
  createdAt: string
  member: { id: string; nome: string; cim: string } | null
}

type MembroOption = { id: string; nome: string; cim: string }

function NovoUsuarioDialog({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [membros, setMembros] = useState<MembroOption[]>([])
  const [form, setForm] = useState({ name: "", email: "", role: "MEMBRO", memberId: "" })

  useEffect(() => {
    fetch("/api/membros?limit=300&situacao=ATIVO")
      .then((r) => r.json())
      .then((d) => setMembros(d.members ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, memberId: form.memberId || null }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? "Erro ao criar usuário")
        return
      }
      toast.success("Usuário criado. Senha inicial = CIM do membro.")
      setForm({ name: "", email: "", role: "MEMBRO", memberId: "" })
      onCreated()
    } catch {
      toast.error("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="h-4 w-4" />Novo usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Membro vinculado <span className="text-muted-foreground text-xs">(senha inicial = CIM)</span></Label>
            <select
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Selecionar membro...</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>{m.nome} — CIM {m.cim}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar usuário
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditarUsuarioDialog({ usuario, onSaved }: { usuario: UsuarioItem; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(usuario.role)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) { toast.error("Erro ao salvar"); return }
      toast.success("Perfil atualizado")
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted transition-colors">
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {usuario.name ?? usuario.email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/usuarios")
    if (res.ok) setUsuarios(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function resetSenha(id: string, nome: string) {
    if (!confirm(`Resetar senha de ${nome} para o CIM do membro?`)) return
    const res = await fetch(`/api/usuarios/${id}/reset-senha`, { method: "POST" })
    if (res.ok) toast.success("Senha resetada. Membro deve trocar no próximo login.")
    else toast.error("Erro ao resetar senha")
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <NovoUsuarioDialog onCreated={load} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Nome</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Perfil</th>
                <th className="text-left p-3 font-medium">Membro</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <Badge variant={u.role === "ADMIN" ? "destructive" : "outline"}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {u.member ? (
                      <span>{u.member.nome} <span className="text-muted-foreground">({u.member.cim})</span></span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.mustChangePassword && (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">
                        Troca pendente
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 flex gap-1 justify-end">
                    <EditarUsuarioDialog usuario={u} onSaved={load} />
                    {u.member && (
                      <button
                        className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted transition-colors"
                        title="Resetar senha para CIM"
                        onClick={() => resetSenha(u.id, u.name ?? u.email)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
