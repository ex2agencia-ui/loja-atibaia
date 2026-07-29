"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ExternalLink,
  Wrench,
} from "lucide-react"

type Config = {
  gatewayAtivo: string
  gatewaySandbox: boolean
  asaasConfigured: boolean
  mercadoPagoConfigured: boolean
  stripeConfigured: boolean
  coraConfigured: boolean
  c6Configured: boolean
  stripeWebhookSecret: string | null
  coraClientId: string | null
  c6ClientId: string | null
  c6CertificatePass: string | null
}

type GatewayId = "MANUAL" | "ASAAS" | "MERCADO_PAGO" | "STRIPE" | "CORA" | "C6BANK"

// ── Logos SVG inline ──────────────────────────────────────────────────────────

function LogoAsaas() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect width="80" height="80" rx="16" fill="#01A09E"/>
      <path d="M40 16C26.745 16 16 26.745 16 40C16 53.255 26.745 64 40 64C53.255 64 64 53.255 64 40C64 26.745 53.255 16 40 16ZM40 56C31.163 56 24 48.837 24 40C24 31.163 31.163 24 40 24C48.837 24 56 31.163 56 40C56 48.837 48.837 56 40 56Z" fill="white"/>
      <path d="M40 32C35.582 32 32 35.582 32 40C32 44.418 35.582 48 40 48C44.418 48 48 44.418 48 40C48 35.582 44.418 32 40 32Z" fill="white"/>
    </svg>
  )
}

function LogoMercadoPago() {
  return (
    <svg viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto">
      <path d="M0 16C0 7.163 7.163 0 16 0H104C112.837 0 120 7.163 120 16C120 24.837 112.837 32 104 32H16C7.163 32 0 24.837 0 16Z" fill="#009EE3"/>
      <path d="M18 10.5C15.515 10.5 13.5 12.515 13.5 15C13.5 17.485 15.515 19.5 18 19.5C20.485 19.5 22.5 17.485 22.5 15C22.5 12.515 20.485 10.5 18 10.5Z" fill="white"/>
      <path d="M30 10.5H27V21.5H30V17H33.5C35.433 17 37 15.433 37 13.5C37 11.567 35.433 10 33.5 10H30V10.5ZM30 14.5V12.5H33.5C34.328 12.5 35 13.172 35 14C35 14.828 34.328 15.5 33.5 15.5H30V14.5Z" fill="white"/>
      <path d="M44 10.5L40 21.5H42.5L43.3 19H47.7L48.5 21.5H51L47 10.5H44ZM44 17L45.5 12.5L47 17H44Z" fill="white"/>
      <path d="M58 10.5L55 18L52 10.5H49L53.5 21.5H56.5L61 10.5H58Z" fill="white"/>
      <path d="M62 10.5V21.5H72V19.5H64.5V17H71V15H64.5V12.5H72V10.5H62Z" fill="white"/>
      <path d="M80 10.5C77.515 10.5 75.5 12.515 75.5 15C75.5 17.485 77.515 19.5 80 19.5C80.97 19.5 81.87 19.2 82.6 18.68L84 20.08L85.4 18.68L84 17.28C84.455 16.573 84.72 15.726 84.72 14.82C84.72 12.335 82.705 10.5 80 10.5ZM80 17.5C78.619 17.5 77.5 16.381 77.5 15C77.5 13.619 78.619 12.5 80 12.5C81.381 12.5 82.5 13.619 82.5 15C82.5 16.381 81.381 17.5 80 17.5Z" fill="white"/>
      <path d="M93 10.5C90.515 10.5 88.5 12.515 88.5 15V21.5H91V18.83C91.6 19.25 92.27 19.5 93 19.5C95.485 19.5 97.5 17.485 97.5 15C97.5 12.515 95.485 10.5 93 10.5ZM93 17.5C91.619 17.5 90.5 16.381 90.5 15C90.5 13.619 91.619 12.5 93 12.5C94.381 12.5 95.5 13.619 95.5 15C95.5 16.381 94.381 17.5 93 17.5Z" fill="white"/>
    </svg>
  )
}

function LogoStripe() {
  return (
    <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-auto">
      <path fillRule="evenodd" clipRule="evenodd" d="M60 12.5C60 19.404 54.627 25 48 25H12C5.373 25 0 19.404 0 12.5C0 5.596 5.373 0 12 0H48C54.627 0 60 5.596 60 12.5Z" fill="#635BFF"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M27.3 9.8C27.3 8.97 27.97 8.63 29.08 8.63C30.64 8.63 32.6 9.11 34.16 9.97V6.19C32.46 5.52 30.78 5.25 29.08 5.25C25.06 5.25 22.38 7.38 22.38 10.03C22.38 14.27 28.17 13.58 28.17 15.42C28.17 16.4 27.33 16.74 26.16 16.74C24.46 16.74 22.3 16.06 20.58 15.06V18.9C22.48 19.72 24.4 20.08 26.16 20.08C30.28 20.08 33.12 17.99 33.12 15.31C33.1 10.73 27.3 11.57 27.3 9.8Z" fill="white"/>
      <path d="M8 5.5L13.5 19.75H17.5L12 5.5H8Z" fill="white"/>
      <path d="M38.5 5.5V19.75H42.5V5.5H38.5Z" fill="white"/>
      <path d="M44 5.5V9H48V19.75H52V9H56V5.5H44Z" fill="white"/>
    </svg>
  )
}

function LogoCora() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect width="80" height="80" rx="16" fill="#FF4D42"/>
      <path d="M40 20C29 20 20 29 20 40C20 51 29 60 40 60C47.2 60 53.5 56.2 57 50.5L50.5 47C48.5 50.3 44.5 52.5 40 52.5C33.1 52.5 27.5 46.9 27.5 40C27.5 33.1 33.1 27.5 40 27.5C44.5 27.5 48.5 29.7 50.5 33L57 29.5C53.5 23.8 47.2 20 40 20Z" fill="white"/>
    </svg>
  )
}

function LogoC6Bank() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect width="80" height="80" rx="16" fill="#242424"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#FFD700" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">C6</text>
    </svg>
  )
}

function GatewayLogo({ id }: { id: GatewayId }) {
  if (id === "ASAAS") return <LogoAsaas />
  if (id === "MERCADO_PAGO") return <LogoMercadoPago />
  if (id === "STRIPE") return <LogoStripe />
  if (id === "CORA") return <LogoCora />
  if (id === "C6BANK") return <LogoC6Bank />
  return <Wrench className="h-5 w-5 text-slate-400" />
}

type Gateway = {
  id: GatewayId
  nome: string
  descricao: string
  url: string
  logoBg: string
  custo: string
  recomendado?: boolean
  testavelOnline: boolean
  configuredKey: keyof Config
}

const GATEWAYS: Gateway[] = [
  {
    id: "MANUAL",
    nome: "Manual",
    descricao: "Sem integração bancária. O tesoureiro registra pagamentos manualmente.",
    url: "",
    logoBg: "bg-slate-100",
    custo: "Gratuito",
    testavelOnline: false,
    configuredKey: "asaasConfigured",
  },
  {
    id: "ASAAS",
    nome: "Asaas",
    descricao: "Fintech de cobranças com PIX, boleto e recorrência nativa. Mais simples de aprovar para associações.",
    url: "https://www.asaas.com",
    logoBg: "bg-[#01A09E]/10",
    custo: "R$ 0,99–1,99 / transação",
    recomendado: true,
    testavelOnline: true,
    configuredKey: "asaasConfigured",
  },
  {
    id: "MERCADO_PAGO",
    nome: "Mercado Pago",
    descricao: "Maior adoção no Brasil. Membros provavelmente já têm conta. PIX com taxa de 0,99%.",
    url: "https://www.mercadopago.com.br",
    logoBg: "bg-[#009EE3]/10",
    custo: "0,99% no PIX",
    testavelOnline: true,
    configuredKey: "mercadoPagoConfigured",
  },
  {
    id: "STRIPE",
    nome: "Stripe",
    descricao: "Melhor experiência de desenvolvimento e sandbox robusto. Foco em cartão internacional.",
    url: "https://stripe.com/br",
    logoBg: "bg-[#635BFF]/10",
    custo: "Variável",
    testavelOnline: true,
    configuredKey: "stripeConfigured",
  },
  {
    id: "CORA",
    nome: "Cora",
    descricao: "Banco digital PJ com PIX gratuito. Exige abertura de conta corrente (CoraPro).",
    url: "https://www.cora.com.br",
    logoBg: "bg-[#FF4D42]/10",
    custo: "PIX gratuito (CoraPro R$ 44,90/mês)",
    testavelOnline: false,
    configuredKey: "coraConfigured",
  },
  {
    id: "C6BANK",
    nome: "C6 Bank",
    descricao: "Banco digital PJ com PIX totalmente gratuito. Autenticação via certificado mTLS.",
    url: "https://www.c6bank.com.br",
    logoBg: "bg-[#242424]/10",
    custo: "PIX gratuito",
    testavelOnline: false,
    configuredKey: "c6Configured",
  },
]

// ── Formulário de credenciais por gateway ─────────────────────────────────────

function AsaasForm({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asaasApiKey: apiKey }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Credenciais salvas"); setApiKey(""); onSaved() }
    else toast.error("Erro ao salvar")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>API Key</Label>
        <Input
          type="password"
          placeholder="$aact_..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <p className="text-xs text-slate-400">
          Obtenha em <span className="font-mono">app.asaas.com → Integrações → API Key</span>
        </p>
      </div>
      <Button size="sm" onClick={save} disabled={!apiKey || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Salvar API Key
      </Button>
    </div>
  )
}

function MercadoPagoForm({ onSaved }: { onSaved: () => void }) {
  const [token, setToken] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mercadoPagoToken: token }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Credenciais salvas"); setToken(""); onSaved() }
    else toast.error("Erro ao salvar")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Access Token</Label>
        <Input
          type="password"
          placeholder="APP_USR-..."
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <p className="text-xs text-slate-400">
          Obtenha em <span className="font-mono">mercadopago.com → Suas integrações → Credenciais</span>
        </p>
      </div>
      <Button size="sm" onClick={save} disabled={!token || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Salvar Token
      </Button>
    </div>
  )
}

function StripeForm({ config, onSaved }: { config: Config; onSaved: () => void }) {
  const [secretKey, setSecretKey] = useState("")
  const [webhookSecret, setWebhookSecret] = useState(config.stripeWebhookSecret ?? "")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeSecretKey: secretKey, stripeWebhookSecret: webhookSecret }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Credenciais salvas"); setSecretKey(""); onSaved() }
    else toast.error("Erro ao salvar")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Secret Key</Label>
        <Input
          type="password"
          placeholder="sk_live_... ou sk_test_..."
          value={secretKey}
          onChange={e => setSecretKey(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Webhook Secret (opcional)</Label>
        <Input
          type="password"
          placeholder="whsec_..."
          value={webhookSecret}
          onChange={e => setWebhookSecret(e.target.value)}
        />
        <p className="text-xs text-slate-400">Necessário para confirmar pagamentos via webhook</p>
      </div>
      <Button size="sm" onClick={save} disabled={!secretKey || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Salvar credenciais
      </Button>
    </div>
  )
}

function CoraForm({ config, onSaved }: { config: Config; onSaved: () => void }) {
  const [clientId, setClientId] = useState(config.coraClientId ?? "")
  const [clientSecret, setClientSecret] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coraClientId: clientId, coraClientSecret: clientSecret }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Credenciais salvas"); setClientSecret(""); onSaved() }
    else toast.error("Erro ao salvar")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Client ID</Label>
        <Input placeholder="..." value={clientId} onChange={e => setClientId(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Client Secret</Label>
        <Input type="password" placeholder="..." value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
      </div>
      <p className="text-xs text-slate-400">Obtenha no portal do desenvolvedor Cora (plano CoraPro obrigatório)</p>
      <Button size="sm" onClick={save} disabled={!clientId || !clientSecret || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Salvar credenciais
      </Button>
    </div>
  )
}

function C6Form({ config, onSaved }: { config: Config; onSaved: () => void }) {
  const [clientId, setClientId] = useState(config.c6ClientId ?? "")
  const [certPass, setCertPass] = useState(config.c6CertificatePass ?? "")
  const [certBase64, setCertBase64] = useState("")
  const [saving, setSaving] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = (ev.target?.result as string).split(",")[1]
      setCertBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        c6ClientId: clientId,
        c6Certificate: certBase64 || undefined,
        c6CertificatePass: certPass,
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Credenciais salvas"); setCertBase64(""); onSaved() }
    else toast.error("Erro ao salvar")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Client ID</Label>
        <Input placeholder="..." value={clientId} onChange={e => setClientId(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Certificado mTLS (.p12)</Label>
        <Input type="file" accept=".p12,.pfx" onChange={handleFile} />
        {certBase64 && <p className="text-xs text-green-600">Arquivo carregado ✓</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Senha do certificado</Label>
        <Input type="password" value={certPass} onChange={e => setCertPass(e.target.value)} />
      </div>
      <p className="text-xs text-slate-400">
        Solicite o certificado em <span className="font-mono">developers.c6bank.com.br</span>
      </p>
      <Button size="sm" onClick={save} disabled={!clientId || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Salvar credenciais
      </Button>
    </div>
  )
}

// ── Card de gateway ───────────────────────────────────────────────────────────

function GatewayCard({
  gw,
  config,
  onSetAtivo,
  onSaved,
}: {
  gw: Gateway
  config: Config
  onSetAtivo: (id: GatewayId) => void
  onSaved: () => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [testando, setTestando] = useState(false)
  const [testeInfo, setTesteInfo] = useState<string | null>(null)

  const isAtivo = config.gatewayAtivo === gw.id
  const isConfigured = gw.id === "MANUAL" || config[gw.configuredKey]

  async function testar() {
    setTestando(true)
    setTesteInfo(null)
    const res = await fetch("/api/admin/integracoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gateway: gw.id }),
    })
    const data = await res.json()
    setTestando(false)
    if (res.ok) {
      setTesteInfo(data.info ?? "Conexão OK")
      toast.success("Conexão bem-sucedida")
    } else {
      toast.error(data.error ?? "Falha na conexão")
    }
  }

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isAtivo
        ? "border-indigo-400 bg-indigo-50/40 shadow-sm"
        : "border-slate-200 bg-white hover:border-slate-300"
    )}>
      <div className="flex items-start gap-4 p-4">
        {/* Logo */}
        <div className={cn(
          "h-11 w-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
          gw.logoBg
        )}>
          <GatewayLogo id={gw.id} />
        </div>

        {/* Dot de status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800">{gw.nome}</h3>
            <div className={cn(
              "h-2 w-2 rounded-full shrink-0",
              isAtivo ? "bg-indigo-500" : isConfigured ? "bg-green-400" : "bg-slate-200"
            )} />
            {gw.recomendado && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                Recomendado
              </Badge>
            )}
            {isAtivo && (
              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                Ativo
              </Badge>
            )}
            {gw.id !== "MANUAL" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  isConfigured
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                )}
              >
                {isConfigured ? "Configurado" : "Não configurado"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{gw.descricao}</p>
          <p className="text-xs text-slate-400 mt-1">{gw.custo}</p>
          {testeInfo && (
            <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {testeInfo}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {gw.url && (
            <a href={gw.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {gw.id !== "MANUAL" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setExpandido(e => !e)}
            >
              {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expandido ? "Fechar" : "Credenciais"}
            </Button>
          )}
          <Button
            size="sm"
            variant={isAtivo ? "secondary" : "outline"}
            className={cn("h-7 px-3 text-xs", isAtivo && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200")}
            disabled={isAtivo}
            onClick={() => onSetAtivo(gw.id)}
          >
            {isAtivo ? "Ativo" : "Usar este"}
          </Button>
        </div>
      </div>

      {/* Formulário de credenciais expandido */}
      {expandido && gw.id !== "MANUAL" && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 bg-slate-50/50 rounded-b-xl">
          {gw.id === "ASAAS" && <AsaasForm onSaved={onSaved} />}
          {gw.id === "MERCADO_PAGO" && <MercadoPagoForm onSaved={onSaved} />}
          {gw.id === "STRIPE" && <StripeForm config={config} onSaved={onSaved} />}
          {gw.id === "CORA" && <CoraForm config={config} onSaved={onSaved} />}
          {gw.id === "C6BANK" && <C6Form config={config} onSaved={onSaved} />}

          {gw.testavelOnline && isConfigured && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs gap-1.5"
                  onClick={testar}
                  disabled={testando}
                >
                  {testando
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <FlaskConical className="h-3 w-3" />
                  }
                  Testar conexão
                </Button>
                {!isConfigured && (
                  <p className="text-xs text-slate-400">Salve as credenciais antes de testar</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function IntegracoesClient() {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)

  const { data: config, isLoading } = useQuery<Config>({
    queryKey: ["admin-integracoes"],
    queryFn: () => fetch("/api/admin/integracoes").then(r => r.json()),
    staleTime: 30_000,
  })

  async function setGatewayAtivo(id: GatewayId) {
    setSaving(true)
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gatewayAtivo: id }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(`Gateway alterado para ${id === "MANUAL" ? "Manual" : id}`)
      qc.invalidateQueries({ queryKey: ["admin-integracoes"] })
    } else {
      toast.error("Erro ao salvar")
    }
  }

  async function setSandbox(val: boolean) {
    const res = await fetch("/api/admin/integracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gatewaySandbox: val }),
    })
    if (res.ok) {
      toast.success(val ? "Modo sandbox ativado" : "Modo produção ativado")
      qc.invalidateQueries({ queryKey: ["admin-integracoes"] })
    }
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-integracoes"] })
  }

  if (isLoading || !config) {
    return (
      <div className="p-6 flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const gatewayAtivoInfo = GATEWAYS.find(g => g.id === config.gatewayAtivo)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Plug className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integrações bancárias</h1>
          <p className="text-sm text-slate-500">Configure o gateway de pagamento para cobranças PIX automáticas</p>
        </div>
      </div>

      {/* Status atual + sandbox toggle */}
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Gateway ativo</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {gatewayAtivoInfo?.nome ?? config.gatewayAtivo}
              {config.gatewayAtivo === "MANUAL" && (
                <span className="ml-2 text-xs font-normal text-slate-400">— sem integração bancária</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.gatewaySandbox}
              onCheckedChange={setSandbox}
              disabled={config.gatewayAtivo === "MANUAL"}
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Modo sandbox</p>
              <p className="text-xs text-slate-400">
                {config.gatewaySandbox ? "Ambiente de testes — nenhuma cobrança real" : "Produção — cobranças reais"}
              </p>
            </div>
          </div>
          {!config.gatewaySandbox && config.gatewayAtivo !== "MANUAL" && (
            <div className="w-full flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span><strong>Modo produção ativo.</strong> Cobranças geradas serão reais.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de gateways */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gateways disponíveis</p>
        {saving && <p className="text-xs text-slate-400 animate-pulse">Salvando...</p>}
        {GATEWAYS.map(gw => (
          <GatewayCard
            key={gw.id}
            gw={gw}
            config={config}
            onSetAtivo={setGatewayAtivo}
            onSaved={invalidate}
          />
        ))}
      </div>

      {/* Aviso sobre implementação */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">Sobre as integrações</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 space-y-1.5">
          <p>As credenciais são armazenadas com criptografia AES-256-GCM — nunca em texto simples.</p>
          <p>A integração bancária (geração de QR Code PIX e confirmação via webhook) ainda não está implementada. Esta tela prepara as configurações para quando o gateway for ativado.</p>
          <p>Recomendamos <strong>Asaas</strong> para a maioria das Lojas: aprovação simples, sem necessidade de abrir conta bancária nova.</p>
        </CardContent>
      </Card>
    </div>
  )
}
