"use client"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memberSchema, MemberFormData } from "@/lib/validations/member"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface MemberFormProps {
  defaultValues?: Partial<MemberFormData>
  onSubmit: (data: MemberFormData) => Promise<void>
  loading?: boolean
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function MemberForm({ defaultValues, onSubmit, loading }: MemberFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      situacao: "ATIVO",
      isWhatsapp: false,
      filhos: [],
      ...defaultValues,
    },
  })

  const { fields: filhos, append, remove } = useFieldArray({
    control: form.control,
    name: "filhos",
  })

  const errors = form.formState.errors

  async function buscarCep(cep: string) {
    const clean = cep.replace(/\D/g, "")
    if (clean.length !== 8) return
    try {
      const res = await fetch(`/api/cep?cep=${clean}`)
      if (!res.ok) return
      const data = await res.json()
      form.setValue("rua", data.rua)
      form.setValue("bairro", data.bairro)
      form.setValue("cidade", data.cidade)
      form.setValue("cep", data.cep)
    } catch {
      toast.error("Erro ao buscar CEP")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="pessoal">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4 h-auto">
          <TabsTrigger value="pessoal" className="text-xs">Pessoal</TabsTrigger>
          <TabsTrigger value="datas" className="text-xs">Datas</TabsTrigger>
          <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
          <TabsTrigger value="contato" className="text-xs">Contato</TabsTrigger>
          <TabsTrigger value="familia" className="text-xs">Família</TabsTrigger>
        </TabsList>

        {/* PESSOAL */}
        <TabsContent value="pessoal" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CIM *" error={errors.cim?.message}>
              <Input {...form.register("cim")} placeholder="219.352" />
            </Field>
            <Field label="Situação *" error={errors.situacao?.message}>
              <Controller control={form.control} name="situacao" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
          </div>
          <Field label="Nome Completo *" error={errors.nome?.message}>
            <Input {...form.register("nome")} placeholder="Nome completo do irmão" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Posição *" error={errors.posicao?.message}>
              <Controller control={form.control} name="posicao" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MI">M.I. - Mestre Instalado</SelectItem>
                    <SelectItem value="MM">M.M. - Mestre Maçon</SelectItem>
                    <SelectItem value="CM">C.M. - Companheiro</SelectItem>
                    <SelectItem value="AM">A.M. - Aprendiz</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Data de Nascimento">
              <Input type="date" {...form.register("dataNascimento")} />
            </Field>
          </div>
        </TabsContent>

        {/* DATAS MAÇÔNICAS */}
        <TabsContent value="datas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Data de Iniciação">
              <Input type="date" {...form.register("dataIniciacao")} />
            </Field>
            <Field label="Data de Elevação">
              <Input type="date" {...form.register("dataElevacao")} />
            </Field>
            <Field label="Data de Exaltação">
              <Input type="date" {...form.register("dataExaltacao")} />
            </Field>
            <Field label="Data de Instalação">
              <Input type="date" {...form.register("dataInstalacao")} />
            </Field>
            <Field label="Data de Regul./Filiação">
              <Input type="date" {...form.register("dataRegulFiliacao")} />
            </Field>
          </div>
        </TabsContent>

        {/* ENDEREÇO */}
        <TabsContent value="endereco" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="CEP">
              <Input
                {...form.register("cep")}
                placeholder="00000-000"
                onBlur={(e) => buscarCep(e.target.value)}
              />
            </Field>
            <div />
          </div>
          <Field label="Rua">
            <Input {...form.register("rua")} />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Número">
              <Input {...form.register("numero")} />
            </Field>
            <Field label="Complemento">
              <Input {...form.register("complemento")} />
            </Field>
            <Field label="Bairro">
              <Input {...form.register("bairro")} />
            </Field>
          </div>
          <Field label="Cidade">
            <Input {...form.register("cidade")} />
          </Field>
        </TabsContent>

        {/* CONTATO */}
        <TabsContent value="contato" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Telefone">
              <Input {...form.register("telefone")} placeholder="(11) 99999-9999" />
            </Field>
            <div className="flex items-center gap-3 pt-7">
              <Controller control={form.control} name="isWhatsapp" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="whatsapp" />
              )} />
              <Label htmlFor="whatsapp">É WhatsApp</Label>
            </div>
          </div>
          <Field label="Email">
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Ocupação / Profissão">
            <Input {...form.register("ocupacao")} />
          </Field>
          <Field label="Notas sobre Ocupação">
            <Textarea {...form.register("notasOcupacao")} rows={3} />
          </Field>
        </TabsContent>

        {/* FAMÍLIA */}
        <TabsContent value="familia" className="space-y-4">
          <div className="border rounded-md p-4 space-y-4">
            <h3 className="font-medium text-sm">Cônjuge (Cunhada)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome da Cônjuge">
                <Input {...form.register("conjuge")} />
              </Field>
              <Field label="Nascimento da Cônjuge">
                <Input type="date" {...form.register("nascimentoConjuge")} />
              </Field>
            </div>
            <Field label="Data do Casamento">
              <Input {...form.register("dataCasamento")} placeholder="Ex: 25/04/1990 ou Divorciado" />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filhos (Sobrinhos)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ nome: "", dataNascimento: "" })}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            {filhos.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end border rounded-md p-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nome">
                    <Input
                      {...form.register(`filhos.${index}.nome`)}
                      placeholder="Nome do filho"
                    />
                  </Field>
                  <Field label="Data de Nascimento">
                    <Input type="date" {...form.register(`filhos.${index}.dataNascimento`)} />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}
