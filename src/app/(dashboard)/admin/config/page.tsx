"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Wallet, Mail, Building2, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Config = {
  id: string
  nome: string
  mensalidadeValorPadrao: number | string
  mensalidadeDiaVencimento: number
  pixChave: string | null
  pixTipo: string | null
  pixBeneficiario: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean
  smtpUser: string | null
  smtpPassConfigured: boolean
  emailRemetente: string | null
  emailNomeRemetente: string | null
  cnpj: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4">{children}</div>
}

function Field({
  label,
  id,
  children,
  hint,
}: {
  label: string
  id?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export default function ConfigPage() {
  const queryClient = useQueryClient()
  const [showPass, setShowPass] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null)

  const { data: config, isLoading } = useQuery<Config>({
    queryKey: ["admin-config"],
    queryFn: () => fetch("/api/admin/config").then((r) => r.json()),
  })

  const [form, setForm] = useState<Partial<Config & { smtpPass: string }>>({})

  useEffect(() => {
    if (config) {
      setForm({
        nome: config.nome ?? "",
        mensalidadeValorPadrao: config.mensalidadeValorPadrao ?? 0,
        mensalidadeDiaVencimento: config.mensalidadeDiaVencimento ?? 10,
        pixChave: config.pixChave ?? "",
        pixTipo: config.pixTipo ?? "",
        pixBeneficiario: config.pixBeneficiario ?? "",
        smtpHost: config.smtpHost ?? "",
        smtpPort: config.smtpPort ?? 587,
        smtpSecure: config.smtpSecure ?? false,
        smtpUser: config.smtpUser ?? "",
        smtpPass: "",
        emailRemetente: config.emailRemetente ?? "",
        emailNomeRemetente: config.emailNomeRemetente ?? "",
        cnpj: config.cnpj ?? "",
        email: config.email ?? "",
        telefone: config.telefone ?? "",
        endereco: config.endereco ?? "",
      })
    }
  }, [config])

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const { mutate: save, isPending, isSuccess, isError } = useMutation({
    mutationFn: (data: unknown) =>
      fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] })
    },
  })

  const handleSave = () => {
    save(form)
  }

  const testSmtp = async () => {
    setSmtpTestResult(null)
    const res = await fetch("/api/admin/config", { method: "POST" })
    const data = await res.json()
    setSmtpTestResult(data)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
            <p className="text-sm text-slate-500">Parâmetros gerais da Loja</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Salvo
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> Erro ao salvar
            </span>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="institucional">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="institucional" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            E-mail / SMTP
          </TabsTrigger>
          <TabsTrigger value="pix" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            PIX
          </TabsTrigger>
        </TabsList>

        {/* ── Institucional ── */}
        <TabsContent value="institucional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Loja</CardTitle>
              <CardDescription>Informações institucionais exibidas em relatórios e comunicações.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field label="Nome da Loja" id="nome">
                  <Input id="nome" value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CNPJ" id="cnpj">
                    <Input id="cnpj" value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                  </Field>
                  <Field label="Telefone" id="telefone">
                    <Input id="telefone" value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} />
                  </Field>
                </div>
                <Field label="E-mail institucional" id="email-inst">
                  <Input id="email-inst" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Endereço do Templo" id="endereco">
                  <Input id="endereco" value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Financeiro ── */}
        <TabsContent value="financeiro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Financeiros</CardTitle>
              <CardDescription>Valores padrão usados na geração de mensalidades.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor padrão da mensalidade (R$)" id="valor-mensalidade" hint="Pode ser ajustado por membro individualmente.">
                    <Input
                      id="valor-mensalidade"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.mensalidadeValorPadrao ?? 0}
                      onChange={(e) => set("mensalidadeValorPadrao", e.target.value)}
                    />
                  </Field>
                  <Field label="Dia de vencimento" id="dia-vencimento" hint="Dia do mês (1–28).">
                    <Input
                      id="dia-vencimento"
                      type="number"
                      min={1}
                      max={28}
                      value={form.mensalidadeDiaVencimento ?? 10}
                      onChange={(e) => set("mensalidadeDiaVencimento", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMTP ── */}
        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Servidor de E-mail (SMTP)</CardTitle>
              <CardDescription>
                Configurações para envio de avisos, cobranças e comunicados por e-mail.
                A senha é armazenada de forma criptografada (AES-256-GCM).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Host SMTP" id="smtp-host">
                    <Input id="smtp-host" value={form.smtpHost ?? ""} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
                  </Field>
                  <Field label="Porta" id="smtp-port">
                    <Input id="smtp-port" type="number" value={form.smtpPort ?? 587} onChange={(e) => set("smtpPort", Number(e.target.value))} />
                  </Field>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="smtp-secure"
                    checked={!!form.smtpSecure}
                    onCheckedChange={(v) => set("smtpSecure", v)}
                  />
                  <Label htmlFor="smtp-secure">Usar SSL/TLS (porta 465)</Label>
                </div>

                <Field label="Usuário / E-mail de autenticação" id="smtp-user">
                  <Input id="smtp-user" type="email" value={form.smtpUser ?? ""} onChange={(e) => set("smtpUser", e.target.value)} />
                </Field>

                <Field
                  label="Senha"
                  id="smtp-pass"
                  hint={
                    config?.smtpPassConfigured
                      ? "Senha já configurada. Deixe em branco para manter a atual."
                      : "Nenhuma senha configurada."
                  }
                >
                  <div className="relative">
                    <Input
                      id="smtp-pass"
                      type={showPass ? "text" : "password"}
                      value={form.smtpPass ?? ""}
                      onChange={(e) => set("smtpPass", e.target.value)}
                      placeholder={config?.smtpPassConfigured ? "••••••••" : "Nova senha"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPass((s) => !s)}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">E-mail remetente</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="E-mail de envio" id="email-remetente">
                    <Input id="email-remetente" type="email" value={form.emailRemetente ?? ""} onChange={(e) => set("emailRemetente", e.target.value)} />
                  </Field>
                  <Field label="Nome exibido" id="nome-remetente">
                    <Input id="nome-remetente" value={form.emailNomeRemetente ?? ""} onChange={(e) => set("emailNomeRemetente", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="border-t pt-4 flex items-center gap-3">
                <Button variant="outline" onClick={testSmtp} type="button">
                  Testar conexão SMTP
                </Button>
                {smtpTestResult && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm",
                      smtpTestResult.ok ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {smtpTestResult.ok ? (
                      <><CheckCircle2 className="h-4 w-4" /> {smtpTestResult.message}</>
                    ) : (
                      <><AlertCircle className="h-4 w-4" /> {smtpTestResult.error}</>
                    )}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PIX ── */}
        <TabsContent value="pix" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chave PIX</CardTitle>
              <CardDescription>Utilizada para geração de QR Codes nas cobranças de mensalidades.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field label="Tipo de chave" id="pix-tipo">
                  <Select value={form.pixTipo ?? ""} onValueChange={(v) => set("pixTipo", v)}>
                    <SelectTrigger id="pix-tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="aleatoria">Chave aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Chave PIX" id="pix-chave">
                  <Input id="pix-chave" value={form.pixChave ?? ""} onChange={(e) => set("pixChave", e.target.value)} />
                </Field>

                <Field label="Nome do beneficiário" id="pix-beneficiario" hint="Aparece no comprovante de pagamento.">
                  <Input id="pix-beneficiario" value={form.pixBeneficiario ?? ""} onChange={(e) => set("pixBeneficiario", e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
