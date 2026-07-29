"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Wallet } from "lucide-react"
import { PerfilFinanceiro } from "./perfil-financeiro"

const perfilSchema = z.object({
  telefone: z.string().optional(),
  isWhatsapp: z.boolean().default(false),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  ocupacao: z.string().optional(),
  notasOcupacao: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
})

type PerfilData = z.infer<typeof perfilSchema>

export function PerfilForm({ memberId, defaultTab }: { memberId: string | null; defaultTab?: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<PerfilData>({
    resolver: zodResolver(perfilSchema) as any,
    defaultValues: { isWhatsapp: false },
  })

  useEffect(() => {
    if (!memberId) { setLoading(false); return }
    fetch(`/api/membros/${memberId}`)
      .then((r) => r.json())
      .then((data) => {
        form.reset({
          telefone: data.telefone ?? "",
          isWhatsapp: data.isWhatsapp ?? false,
          email: data.email ?? "",
          ocupacao: data.ocupacao ?? "",
          notasOcupacao: data.notasOcupacao ?? "",
          rua: data.rua ?? "",
          numero: data.numero ?? "",
          complemento: data.complemento ?? "",
          bairro: data.bairro ?? "",
          cep: data.cep ?? "",
          cidade: data.cidade ?? "",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [memberId, form])

  async function buscarCep(cep: string) {
    const clean = cep.replace(/\D/g, "")
    if (clean.length !== 8) return
    const res = await fetch(`/api/cep?cep=${clean}`)
    if (!res.ok) return
    const data = await res.json()
    form.setValue("rua", data.rua)
    form.setValue("bairro", data.bairro)
    form.setValue("cidade", data.cidade)
  }

  async function onSubmit(values: PerfilData) {
    if (!memberId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/membros/${memberId}`)
      const current = await res.json()
      const body = {
        ...current,
        ...values,
        filhos: current.filhos?.map((f: { nome: string; dataNascimento?: string | null }) => ({
          nome: f.nome,
          dataNascimento: f.dataNascimento ?? null,
        })) ?? [],
      }
      const saveRes = await fetch(`/api/membros/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!saveRes.ok) throw new Error("Erro ao salvar")
      toast.success("Perfil atualizado com sucesso")
    } catch {
      toast.error("Erro ao salvar perfil")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  if (!memberId) {
    return (
      <div className="p-6 text-muted-foreground">
        Seu usuário não está vinculado a um membro. Contate o administrador.
      </div>
    )
  }

  const errors = form.formState.errors

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Tabs defaultValue={defaultTab === "financeiro" ? "financeiro" : "dados"}>
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="dados" className="flex items-center gap-1.5 flex-1">
            <User className="h-3.5 w-3.5" /> Dados
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1.5 flex-1">
            <Wallet className="h-3.5 w-3.5" /> Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...form.register("telefone")} placeholder="(11) 99999-9999" />
                {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
              </div>
              <div className="space-y-1.5 flex flex-col justify-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.watch("isWhatsapp")}
                    onCheckedChange={(v) => form.setValue("isWhatsapp", v)}
                  />
                  <Label>É WhatsApp</Label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" placeholder="seu@email.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>CEP</Label>
                <Input
                  {...form.register("cep")}
                  placeholder="00000-000"
                  onBlur={(e) => buscarCep(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Rua</Label>
                <Input {...form.register("rua")} />
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input {...form.register("numero")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Complemento</Label>
                <Input {...form.register("complemento")} />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input {...form.register("bairro")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input {...form.register("cidade")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ocupação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ocupação</Label>
              <Input {...form.register("ocupacao")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <textarea
                {...form.register("notasOcupacao")}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Informações adicionais sobre sua ocupação..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          <PerfilFinanceiro memberId={memberId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
