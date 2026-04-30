"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Quote, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Frase = {
  id: string
  texto: string
  autor: string
  descricaoAutor: string | null
  tema: string
  ativo: boolean
}

type FormData = { texto: string; autor: string; descricaoAutor: string; tema: string; ativo: boolean }
const emptyForm: FormData = { texto: "", autor: "", descricaoAutor: "", tema: "", ativo: true }

export default function FrasesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<{ open: boolean; frase?: Frase }>({ open: false })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  const { data, isLoading } = useQuery<{ frases: Frase[] }>({
    queryKey: ["frases"],
    queryFn: () => fetch("/api/frases").then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: FormData) => fetch("/api/frases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["frases"] }); closeDialog(); toast.success("Frase criada") },
    onError: () => toast.error("Erro ao criar frase"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: FormData & { id: string }) => fetch(`/api/frases/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["frases"] }); closeDialog(); toast.success("Frase atualizada") },
    onError: () => toast.error("Erro ao atualizar frase"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/frases/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["frases"] }); setDeleteId(null); toast.success("Frase excluída") },
    onError: () => toast.error("Erro ao excluir frase"),
  })

  function openAdd() { setForm(emptyForm); setDialog({ open: true }) }
  function openEdit(f: Frase) { setForm({ texto: f.texto, autor: f.autor, descricaoAutor: f.descricaoAutor ?? "", tema: f.tema, ativo: f.ativo }); setDialog({ open: true, frase: f }) }
  function closeDialog() { setDialog({ open: false }) }

  function submit() {
    if (!form.texto.trim() || !form.autor.trim() || !form.tema.trim()) { toast.error("Preencha todos os campos"); return }
    if (dialog.frase) updateMutation.mutate({ ...form, id: dialog.frase.id })
    else createMutation.mutate(form)
  }

  const filtered = (data?.frases ?? []).filter((f) =>
    !search || f.texto.toLowerCase().includes(search.toLowerCase()) || f.autor.toLowerCase().includes(search.toLowerCase()) || f.tema.toLowerCase().includes(search.toLowerCase())
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frases</h1>
          <p className="text-sm text-muted-foreground">{data?.frases.length ?? "—"} frases cadastradas</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Nova Frase
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por frase, autor ou tema..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma frase encontrada.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <Card key={f.id} className={!f.ativo ? "opacity-50" : ""}>
              <CardContent className="py-4">
                <div className="flex gap-4 items-start">
                  <Quote className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{f.texto}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        — {f.autor}{f.descricaoAutor ? ` (${f.descricaoAutor})` : ""}
                      </span>
                      <Badge variant="outline" className="text-xs">{f.tema}</Badge>
                      {!f.ativo && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.frase ? "Editar Frase" : "Nova Frase"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Frase</Label>
              <Textarea rows={4} placeholder="Digite a frase..." value={form.texto} onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Autor</Label>
              <Input placeholder="Nome do autor..." value={form.autor} onChange={(e) => setForm((p) => ({ ...p, autor: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição do Autor <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input placeholder="Ex: Filósofo e político romano..." value={form.descricaoAutor} onChange={(e) => setForm((p) => ({ ...p, descricaoAutor: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tema</Label>
              <Input placeholder="Ex: Fraternidade, Liberdade..." value={form.tema} onChange={(e) => setForm((p) => ({ ...p, tema: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="ativo" className="font-normal cursor-pointer">Frase ativa (exibida no dashboard)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={submit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir frase?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
