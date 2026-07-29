"use client"

import { use, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AttendanceTable } from "@/components/sessoes/attendance-table"
import { CheckinModal } from "@/components/sessoes/checkin-modal"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Link from "next/link"
import { ChevronLeft, Trash2, Camera, X, Pencil, Check, Users } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }
const TIPOS = ["ORDINARIA", "MAGNA", "ESPECIAL"] as const

export default function SessaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ data: "", tipo: "", descricao: "" })
  const [saving, setSaving] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descText, setDescText] = useState("")
  const [savingDesc, setSavingDesc] = useState(false)
  const [checkInAbertoOverride, setCheckInAbertoOverride] = useState<boolean | null>(null)

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["session", id],
    queryFn: () => fetch(`/api/sessoes/${id}`).then((r) => r.json()),
  })

  const checkInAberto = checkInAbertoOverride ?? session?.checkInAberto ?? false

  const { data: presencas, isLoading: loadingPresencas, refetch: refetchPresencas } = useQuery({
    queryKey: ["presencas", id],
    queryFn: () => fetch(`/api/sessoes/${id}/presenca`).then((r) => r.json()),
    refetchInterval: 10_000,
  })

  function handleStartEdit() {
    const isoDate = session?.data ? session.data.substring(0, 10) : ""
    setEditData({ data: isoDate, tipo: session?.tipo ?? "ORDINARIA", descricao: session?.descricao ?? "" })
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/sessoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (!res.ok) throw new Error()
      await qc.invalidateQueries({ queryKey: ["session", id] })
      toast.success("Sessão atualizada")
      setEditing(false)
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDesc() {
    setSavingDesc(true)
    try {
      const res = await fetch(`/api/sessoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: session.data.substring(0, 10), tipo: session.tipo, descricao: descText }),
      })
      if (!res.ok) throw new Error()
      await qc.invalidateQueries({ queryKey: ["session", id] })
      toast.success("Descritivo salvo")
      setEditingDesc(false)
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSavingDesc(false)
    }
  }

  async function handleDelete() {
    await fetch(`/api/sessoes/${id}`, { method: "DELETE" })
    await qc.invalidateQueries({ queryKey: ["sessions"] })
    toast.success("Sessão excluída")
    router.push("/sessoes")
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const fd = new FormData()
      fd.append("foto", file)
      const res = await fetch(`/api/sessoes/${id}/foto`, { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      await qc.invalidateQueries({ queryKey: ["session", id] })
      toast.success("Foto salva!")
    } catch {
      toast.error("Erro ao enviar foto")
    } finally {
      setUploadingFoto(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleFotoDelete() {
    await fetch(`/api/sessoes/${id}/foto`, { method: "DELETE" })
    await qc.invalidateQueries({ queryKey: ["session", id] })
    toast.success("Foto removida")
  }

  if (loadingSession) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sessoes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <ChevronLeft className="h-4 w-4" />
          </Link>

          {editing ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={editData.data}
                  onChange={(e) => setEditData((p) => ({ ...p, data: e.target.value }))}
                  className="w-36"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <select
                  value={editData.tipo}
                  onChange={(e) => setEditData((p) => ({ ...p, tipo: e.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="h-4 w-4 mr-1" />{saving ? "Salvando…" : "Salvar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{formatarData(session?.data)}</h1>
                <Badge variant="outline">{TIPO_LABEL[session?.tipo]}</Badge>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleStartEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              {session?.descricao && <p className="text-sm text-muted-foreground">{session.descricao}</p>}
            </div>
          )}
        </div>

        {!editing && (
          <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-destructive border-destructive")}>
              <Trash2 className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
                <AlertDialogDescription>Todos os registros de presença serão perdidos.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Quórum + QR */}
      <div className="flex flex-wrap items-center gap-3">
        {presencas && (() => {
          const total = presencas.length
          const presentes = presencas.filter((p: { presenca?: { status: string } }) => p.presenca?.status === "P").length
          const pct = total > 0 ? Math.round((presentes / total) * 100) : 0
          const quorum = total > 0 && presentes >= Math.ceil(total / 3)
          const cor = quorum ? "text-green-600" : presentes >= Math.ceil(total / 4) ? "text-amber-600" : "text-red-600"
          return (
            <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium", cor)}>
              <Users className="h-4 w-4" />
              {presentes} / {total} presentes ({pct}%)
              {quorum && <Badge className="bg-green-600 text-white text-xs ml-1">Quórum ✓</Badge>}
            </div>
          )
        })()}
        {session?.checkInToken && (
          <CheckinModal
            sessionId={id}
            checkInToken={session.checkInToken}
            checkInAberto={checkInAberto}
            onToggle={setCheckInAbertoOverride}
            sessaoData={session.data}
            sessaoTipo={session.tipo}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
        {session?.fotoUrl ? (
          <div className="flex items-center gap-3">
            <a href={session.fotoUrl} target="_blank" rel="noopener noreferrer">
              <Image src={session.fotoUrl} alt="Livro de presença" width={80} height={60} className="rounded border object-cover" />
            </a>
            <Button variant="outline" size="sm" className="text-destructive" onClick={handleFotoDelete}>
              <X className="h-4 w-4 mr-1" />Remover foto
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingFoto}>
            <Camera className="h-4 w-4 mr-2" />
            {uploadingFoto ? "Enviando..." : "Foto do Livro"}
          </Button>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Descritivo da Sessão</span>
          {!editingDesc && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDescText(session?.descricao ?? ""); setEditingDesc(true) }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {editingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              placeholder="Descreva o que ocorreu nesta sessão..."
              rows={5}
              className="resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSaveDesc} disabled={savingDesc}>
                <Check className="h-4 w-4 mr-1" />{savingDesc ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {session?.descricao || <span className="italic">Nenhum descritivo registrado.</span>}
          </p>
        )}
      </div>

      {loadingPresencas ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <AttendanceTable
          sessionId={id}
          rows={presencas ?? []}
          onSaved={() => refetchPresencas()}
        />
      )}
    </div>
  )
}
