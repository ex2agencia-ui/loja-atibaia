"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RotateCcw, Pencil, ShieldCheck, ShieldOff, Loader2, UserPlus } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARIO: "Secretário",
  CHANCELARIA: "Chancelaria",
  FINANCEIRO: "Financeiro",
  MEMBRO: "Membro",
}
const ROLES = Object.keys(ROLE_LABELS)

type UsuarioVinculado = {
  id: string
  email: string
  role: string
  mustChangePassword: boolean
}

type Props = {
  memberId: string
  membroNome: string
  membroEmail?: string | null
  usuario: UsuarioVinculado | null
  isAdmin: boolean
  onRefresh: () => void
}

function EditarRoleDialog({ usuario, onSaved }: { usuario: UsuarioVinculado; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(usuario.role)
  const [loading, setLoading] = useState(false)

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
      setOpen(false)
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar perfil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar perfil de acesso</DialogTitle>
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

function CriarContaDialog({ memberId, membroNome, membroEmail, onCreated }: {
  memberId: string
  membroNome: string
  membroEmail?: string | null
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: membroEmail ?? "", role: "MEMBRO" })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: membroNome, email: form.email, role: form.role, memberId }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? "Erro ao criar conta")
        return
      }
      toast.success("Conta criada. Senha inicial = CIM do membro.")
      setOpen(false)
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Criar conta de acesso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar conta para {membroNome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Email de login</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil de acesso</Label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">A senha inicial será o CIM do membro. Ele deverá alterá-la no primeiro acesso.</p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar conta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AcessoSistemaCard({ memberId, membroNome, membroEmail, usuario, isAdmin, onRefresh }: Props) {
  const [resetting, setResetting] = useState(false)

  async function resetSenha() {
    if (!usuario) return
    if (!confirm(`Resetar senha de ${membroNome} para o CIM?`)) return
    setResetting(true)
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}/reset-senha`, { method: "POST" })
      if (res.ok) toast.success("Senha resetada. Membro deve trocar no próximo login.")
      else toast.error("Erro ao resetar senha")
      onRefresh()
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {usuario ? (
            <ShieldCheck className="h-4 w-4 text-green-600" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          )}
          Acesso ao Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!usuario ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Este irmão não possui conta de acesso ao sistema.
            </p>
            {isAdmin && (
              <CriarContaDialog
                memberId={memberId}
                membroNome={membroNome}
                membroEmail={membroEmail}
                onCreated={onRefresh}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{usuario.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Perfil</span>
                <p className="mt-0.5">
                  <Badge variant={usuario.role === "ADMIN" ? "destructive" : "secondary"}>
                    {ROLE_LABELS[usuario.role] ?? usuario.role}
                  </Badge>
                </p>
              </div>
              {usuario.mustChangePassword && (
                <div className="col-span-2">
                  <Badge variant="outline" className="text-amber-600 border-amber-400">
                    Troca de senha pendente
                  </Badge>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-2 pt-1">
                <EditarRoleDialog usuario={usuario} onSaved={onRefresh} />
                <Button variant="outline" size="sm" onClick={resetSenha} disabled={resetting}>
                  {resetting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Resetar senha
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
