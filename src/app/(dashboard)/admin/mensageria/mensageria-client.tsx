"use client"

import { useEffect, useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare, Mail, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Radio, ScrollText, Zap, RefreshCw, Wifi, WifiOff, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

type MensageriaConfig = {
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean
  smtpUser: string | null
  smtpPassConfigured: boolean
  emailRemetente: string | null
  emailNomeRemetente: string | null
  emailAtivoNotif: boolean
  whatsappAtivo: boolean
  whatsappProvedor: "EVOLUTION" | "META" | "EXXOR"
  evolutionUrl: string | null
  evolutionApiKeyConfigured: boolean
  evolutionInstance: string | null
  metaWabaId: string | null
  metaPhoneNumberId: string | null
  metaTokenConfigured: boolean
  exxorApiKeyConfigured: boolean
  exxorNumero: string | null
}

type WaStatus = {
  status: "open" | "connecting" | "close" | "not_found"
  ownerJid: string | null
  profileName: string | null
  profilePicUrl: string | null
}

type Log = {
  id: string
  canal: string
  evento: string
  status: string
  destinatario: string | null
  assunto: string | null
  erro: string | null
  createdAt: string
  member: { nome: string } | null
}

function Field({ label, id, children, hint }: { label: string; id?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "ENVIADO" ? "default" : status === "ERRO" ? "destructive" : "secondary"}
      className="text-xs"
    >
      {status}
    </Badge>
  )
}

function CanalBadge({ canal }: { canal: string }) {
  const map: Record<string, string> = {
    EMAIL: "bg-blue-100 text-blue-700",
    WHATSAPP: "bg-green-100 text-green-700",
    COMUNICADO: "bg-purple-100 text-purple-700",
  }
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", map[canal] ?? "bg-slate-100 text-slate-600")}>
      {canal}
    </span>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ── Painel de conexão Evolution (QR Code) ──────────────────────────────────
function EvolutionConnectionPanel({ configured }: { configured: boolean }) {
  const [qrBase64, setQrBase64] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: waStatus, refetch: refetchStatus } = useQuery<WaStatus>({
    queryKey: ["wa-status"],
    queryFn: () => fetch("/api/admin/mensageria/whatsapp?acao=status").then(r => r.json()),
    refetchInterval: 5000,
    enabled: configured,
  })

  const isOpen = waStatus?.status === "open"
  const isConnecting = waStatus?.status === "connecting"

  // Para o polling do QR quando conectado
  useEffect(() => {
    if (isOpen && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
      setQrBase64(null)
    }
  }, [isOpen])

  const fetchQr = async () => {
    setLoadingQr(true)
    try {
      const res = await fetch("/api/admin/mensageria/whatsapp?acao=qrcode")
      const data = await res.json()
      if (data.base64) setQrBase64(data.base64)
    } finally {
      setLoadingQr(false)
    }
  }

  const startQr = async () => {
    await fetchQr()
    // Renova o QR a cada 25s (expira em ~30s no WhatsApp)
    pollRef.current = setInterval(fetchQr, 25000)
  }

  const stopQr = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setQrBase64(null)
  }

  const disconnect = async () => {
    setDisconnecting(true)
    await fetch("/api/admin/mensageria/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "disconnect" }),
    })
    setDisconnecting(false)
    stopQr()
    refetchStatus()
  }

  // Limpa ao desmontar
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  if (!configured) {
    return (
      <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 text-sm text-amber-700">
        Salve a URL, instância e API Key da Evolution antes de conectar.
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Status bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3",
        isOpen ? "bg-green-50 border-b border-green-200" : "bg-slate-50 border-b border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          {isOpen
            ? <Wifi className="h-4 w-4 text-green-600" />
            : <WifiOff className="h-4 w-4 text-slate-400" />
          }
          <span className={cn("text-sm font-medium", isOpen ? "text-green-700" : "text-slate-600")}>
            {isOpen ? "Conectado" : isConnecting ? "Aguardando conexão…" : "Desconectado"}
          </span>
          {isOpen && waStatus?.profileName && (
            <span className="text-sm text-green-600">— {waStatus.profileName}</span>
          )}
          {isOpen && waStatus?.ownerJid && (
            <span className="text-xs text-slate-500">
              ({waStatus.ownerJid.replace("@s.whatsapp.net", "")})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => refetchStatus()}
          >
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
          {isOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={disconnect}
              disabled={disconnecting}
            >
              {disconnecting
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <LogOut className="h-3 w-3" />
              }
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {/* Corpo: perfil conectado ou QR Code */}
      <div className="p-4">
        {isOpen ? (
          <div className="flex items-center gap-4">
            {waStatus?.profilePicUrl && (
              <img
                src={waStatus.profilePicUrl}
                alt="Foto de perfil"
                className="h-14 w-14 rounded-full object-cover border"
              />
            )}
            <div>
              <p className="font-medium text-slate-800">{waStatus?.profileName ?? "—"}</p>
              <p className="text-sm text-slate-500">
                {waStatus?.ownerJid?.replace("@s.whatsapp.net", "") ?? ""}
              </p>
              <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Pronto para enviar mensagens
              </p>
            </div>
          </div>
        ) : qrBase64 ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-slate-600">
              Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong> e escaneie:
            </p>
            <div className="border-4 border-white shadow-md rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrBase64} alt="QR Code WhatsApp" className="h-52 w-52" />
            </div>
            <p className="text-xs text-slate-400">O QR Code se renova automaticamente a cada 25 segundos</p>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={stopQr}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <WhatsAppIcon />
            <p className="text-sm text-slate-600 text-center">
              Vincule um número WhatsApp para começar a enviar notificações.
            </p>
            <Button onClick={startQr} disabled={loadingQr} className="gap-2">
              {loadingQr
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando QR Code…</>
                : "Gerar QR Code para conectar"
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function MensageriaClient() {
  const queryClient = useQueryClient()
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showEvoKey, setShowEvoKey] = useState(false)
  const [showMetaToken, setShowMetaToken] = useState(false)
  const [showExxorKey, setShowExxorKey] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null)

  const { data: config, isLoading } = useQuery<MensageriaConfig>({
    queryKey: ["admin-mensageria"],
    queryFn: () => fetch("/api/admin/mensageria").then(r => r.json()),
  })

  const { data: logsData, isLoading: logsLoading } = useQuery<{ logs: Log[]; total: number }>({
    queryKey: ["mensageria-logs"],
    queryFn: () => fetch("/api/admin/mensageria/logs").then(r => r.json()),
  })

  const [form, setForm] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (config) {
      setForm({
        smtpHost: config.smtpHost ?? "",
        smtpPort: config.smtpPort ?? 587,
        smtpSecure: config.smtpSecure ?? false,
        smtpUser: config.smtpUser ?? "",
        smtpPass: "",
        emailRemetente: config.emailRemetente ?? "",
        emailNomeRemetente: config.emailNomeRemetente ?? "",
        emailAtivoNotif: config.emailAtivoNotif ?? true,
        whatsappAtivo: config.whatsappAtivo ?? false,
        whatsappProvedor: config.whatsappProvedor ?? "EVOLUTION",
        evolutionUrl: config.evolutionUrl ?? "",
        evolutionApiKey: "",
        evolutionInstance: config.evolutionInstance ?? "",
        metaWabaId: config.metaWabaId ?? "",
        metaPhoneNumberId: config.metaPhoneNumberId ?? "",
        metaToken: "",
        exxorApiKey: "",
        exxorNumero: config.exxorNumero ?? "",
      })
    }
  }, [config])

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const { mutate: save, isPending, isSuccess, isError } = useMutation({
    mutationFn: (data: unknown) =>
      fetch("/api/admin/mensageria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mensageria"] }),
  })

  const testSmtp = async () => {
    setSmtpTestResult(null)
    const res = await fetch("/api/admin/mensageria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "smtp" }),
    })
    setSmtpTestResult(await res.json())
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const provedorAtivo = form.whatsappProvedor as string

  // Evolution está configurado se URL + instância + key estiverem salvos
  const evolutionConfigured =
    !!(config?.evolutionUrl && config?.evolutionInstance && config?.evolutionApiKeyConfigured)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mensageria</h1>
            <p className="text-sm text-slate-500">Canais de comunicação e notificação</p>
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
          <Button onClick={() => save(form)} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar alterações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="canais">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="canais" className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" /> Canais
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Logs
          </TabsTrigger>
          <TabsTrigger value="disparo" className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Disparo Manual
          </TabsTrigger>
        </TabsList>

        {/* ── CANAIS ── */}
        <TabsContent value="canais" className="mt-6 space-y-6">

          {/* E-mail / SMTP */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <CardTitle>E-mail / SMTP</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-ativo" className="text-sm text-slate-600">Ativo</Label>
                  <Switch
                    id="email-ativo"
                    checked={!!form.emailAtivoNotif}
                    onCheckedChange={v => set("emailAtivoNotif", v)}
                  />
                </div>
              </div>
              <CardDescription>
                Servidor SMTP para envio de avisos, cobranças e comunicados. Senha criptografada com AES-256-GCM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Host SMTP" id="smtp-host">
                  <Input id="smtp-host" value={String(form.smtpHost ?? "")} onChange={e => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="Porta" id="smtp-port">
                  <Input id="smtp-port" type="number" value={String(form.smtpPort ?? 587)} onChange={e => set("smtpPort", Number(e.target.value))} />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="smtp-secure" checked={!!form.smtpSecure} onCheckedChange={v => set("smtpSecure", v)} />
                <Label htmlFor="smtp-secure">Usar SSL/TLS (porta 465)</Label>
              </div>

              <Field label="Usuário / E-mail de autenticação" id="smtp-user">
                <Input id="smtp-user" type="email" value={String(form.smtpUser ?? "")} onChange={e => set("smtpUser", e.target.value)} />
              </Field>

              <Field label="Senha" id="smtp-pass" hint={config?.smtpPassConfigured ? "Senha já configurada. Deixe em branco para manter." : "Nenhuma senha configurada."}>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showSmtpPass ? "text" : "password"}
                    value={String(form.smtpPass ?? "")}
                    onChange={e => set("smtpPass", e.target.value)}
                    placeholder={config?.smtpPassConfigured ? "••••••••" : "Nova senha"}
                    className="pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowSmtpPass(s => !s)}>
                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <Field label="E-mail de envio" id="email-remetente">
                  <Input id="email-remetente" type="email" value={String(form.emailRemetente ?? "")} onChange={e => set("emailRemetente", e.target.value)} />
                </Field>
                <Field label="Nome exibido" id="nome-remetente">
                  <Input id="nome-remetente" value={String(form.emailNomeRemetente ?? "")} onChange={e => set("emailNomeRemetente", e.target.value)} />
                </Field>
              </div>

              <div className="flex items-center gap-3 border-t pt-4">
                <Button variant="outline" onClick={testSmtp} type="button">Testar conexão SMTP</Button>
                {smtpTestResult && (
                  <span className={cn("flex items-center gap-1 text-sm", smtpTestResult.ok ? "text-green-600" : "text-red-600")}>
                    {smtpTestResult.ok
                      ? <><CheckCircle2 className="h-4 w-4" /> {smtpTestResult.message}</>
                      : <><AlertCircle className="h-4 w-4" /> {smtpTestResult.error}</>
                    }
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WhatsAppIcon />
                  <CardTitle>WhatsApp</CardTitle>
                  {!!form.whatsappAtivo && <Badge variant="default" className="ml-1 text-xs bg-green-600">Ativo</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="wa-ativo" className="text-sm text-slate-600">Habilitar</Label>
                  <Switch id="wa-ativo" checked={!!form.whatsappAtivo} onCheckedChange={v => set("whatsappAtivo", v)} />
                </div>
              </div>
              <CardDescription>
                Envio de notificações via WhatsApp. Escolha o provedor e configure as credenciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Seleção de provedor */}
              <div className="grid grid-cols-3 gap-3">
                {(["EVOLUTION", "META", "EXXOR"] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("whatsappProvedor", p)}
                    className={cn(
                      "border rounded-lg p-3 text-left transition-all",
                      provedorAtivo === p
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <p className="font-medium text-sm text-slate-800">
                      {p === "EVOLUTION" ? "Evolution API" : p === "META" ? "Meta Cloud API" : "Exxor"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p === "EVOLUTION" ? "Self-hosted OSS" : p === "META" ? "Oficial Meta" : "Terceiro BR"}
                    </p>
                  </button>
                ))}
              </div>

              {/* Evolution */}
              {provedorAtivo === "EVOLUTION" && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                    <p className="text-sm font-medium text-slate-700">Credenciais Evolution API</p>
                    <Field label="URL do servidor" id="evo-url">
                      <Input
                        id="evo-url"
                        value={String(form.evolutionUrl ?? "")}
                        onChange={e => set("evolutionUrl", e.target.value)}
                        placeholder="https://evolution-api-production-xxx.up.railway.app"
                      />
                    </Field>
                    <Field label="Nome da instância" id="evo-instance">
                      <Input
                        id="evo-instance"
                        value={String(form.evolutionInstance ?? "")}
                        onChange={e => set("evolutionInstance", e.target.value)}
                        placeholder="loja-atibaia"
                      />
                    </Field>
                    <Field
                      label="API Key"
                      id="evo-key"
                      hint={config?.evolutionApiKeyConfigured ? "Chave já configurada. Deixe em branco para manter." : "Nenhuma chave configurada."}
                    >
                      <div className="relative">
                        <Input
                          id="evo-key"
                          type={showEvoKey ? "text" : "password"}
                          value={String(form.evolutionApiKey ?? "")}
                          onChange={e => set("evolutionApiKey", e.target.value)}
                          placeholder={config?.evolutionApiKeyConfigured ? "••••••••" : "Nova API key"}
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowEvoKey(s => !s)}>
                          {showEvoKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                    <p className="text-xs text-slate-500">
                      Salve as credenciais acima antes de conectar o número abaixo.
                    </p>
                  </div>

                  {/* Painel de conexão QR Code */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Conexão do número</p>
                    <EvolutionConnectionPanel configured={evolutionConfigured} />
                  </div>
                </div>
              )}

              {/* Meta */}
              {provedorAtivo === "META" && (
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                  <p className="text-sm font-medium text-slate-700">Configuração Meta Cloud API</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="WABA ID" id="meta-waba">
                      <Input id="meta-waba" value={String(form.metaWabaId ?? "")} onChange={e => set("metaWabaId", e.target.value)} />
                    </Field>
                    <Field label="Phone Number ID" id="meta-phone">
                      <Input id="meta-phone" value={String(form.metaPhoneNumberId ?? "")} onChange={e => set("metaPhoneNumberId", e.target.value)} />
                    </Field>
                  </div>
                  <Field
                    label="Token de acesso"
                    id="meta-token"
                    hint={config?.metaTokenConfigured ? "Token já configurado. Deixe em branco para manter." : "Nenhum token configurado."}
                  >
                    <div className="relative">
                      <Input
                        id="meta-token"
                        type={showMetaToken ? "text" : "password"}
                        value={String(form.metaToken ?? "")}
                        onChange={e => set("metaToken", e.target.value)}
                        placeholder={config?.metaTokenConfigured ? "••••••••" : "Novo token"}
                        className="pr-10"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowMetaToken(s => !s)}>
                        {showMetaToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠ Requer aprovação de conta business na Meta.
                  </div>
                </div>
              )}

              {/* Exxor */}
              {provedorAtivo === "EXXOR" && (
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                  <p className="text-sm font-medium text-slate-700">Configuração Exxor</p>
                  <Field label="Número WhatsApp" id="exxor-numero">
                    <Input id="exxor-numero" value={String(form.exxorNumero ?? "")} onChange={e => set("exxorNumero", e.target.value)} placeholder="5511999999999" />
                  </Field>
                  <Field
                    label="API Key"
                    id="exxor-key"
                    hint={config?.exxorApiKeyConfigured ? "Chave já configurada. Deixe em branco para manter." : "Nenhuma chave configurada."}
                  >
                    <div className="relative">
                      <Input
                        id="exxor-key"
                        type={showExxorKey ? "text" : "password"}
                        value={String(form.exxorApiKey ?? "")}
                        onChange={e => set("exxorApiKey", e.target.value)}
                        placeholder={config?.exxorApiKeyConfigured ? "••••••••" : "Nova API key"}
                        className="pr-10"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowExxorKey(s => !s)}>
                        {showExxorKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠ Implementação mock ativa.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LOGS ── */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Log de Notificações</CardTitle>
              <CardDescription>Histórico de todas as mensagens enviadas pelo sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : !logsData?.logs?.length ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhuma notificação registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {logsData.logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CanalBadge canal={log.canal} />
                          <span className="font-medium text-slate-700">{log.evento.replace(/_/g, " ")}</span>
                          {log.member && <span className="text-slate-500">— {log.member.nome}</span>}
                        </div>
                        {log.destinatario && <p className="text-slate-500 text-xs mt-0.5">{log.destinatario}</p>}
                        {log.erro && <p className="text-red-600 text-xs mt-0.5 truncate">{log.erro}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={log.status} />
                        <span className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {logsData.total > logsData.logs.length && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      Exibindo {logsData.logs.length} de {logsData.total} registros.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DISPARO MANUAL ── */}
        <TabsContent value="disparo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Disparo Manual</CardTitle>
              <CardDescription>Em breve — envio pontual de notificações para membros ou grupos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Zap className="h-10 w-10 opacity-30" />
                <p className="text-sm">Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
