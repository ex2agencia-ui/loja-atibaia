"use client"

import { use, useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatarData } from "@/lib/utils/format"
import { CheckCircle, XCircle, Clock, LogIn, ShieldX } from "lucide-react"

const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }

type SessaoInfo = {
  id: string
  data: string
  tipo: string
  descricao: string | null
  checkInAberto: boolean
}

type Estado = "carregando" | "invalido" | "encerrado" | "aguardando_login" | "sem_vinculo" | "pronto" | "confirmando" | "confirmado" | "ja_registrado"

export default function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { data: authSession, status } = useSession()
  const [sessao, setSessao] = useState<SessaoInfo | null>(null)
  const [estado, setEstado] = useState<Estado>("carregando")

  useEffect(() => {
    fetch(`/api/checkin/${token}`)
      .then((r) => {
        if (!r.ok) { setEstado("invalido"); return null }
        return r.json()
      })
      .then((data: SessaoInfo | null) => {
        if (!data) return
        setSessao(data)
        if (!data.checkInAberto) { setEstado("encerrado"); return }
        // aguardar status de autenticação
      })
  }, [token])

  useEffect(() => {
    if (!sessao) return
    if (!sessao.checkInAberto) { setEstado("encerrado"); return }
    if (status === "loading") return
    if (status === "unauthenticated") { setEstado("aguardando_login"); return }
    const memberId = (authSession?.user as { memberId?: string | null })?.memberId
    if (!memberId) { setEstado("sem_vinculo"); return }
    setEstado("pronto")
  }, [sessao, status, authSession])

  async function confirmar() {
    setEstado("confirmando")
    const res = await fetch(`/api/checkin/${token}`, { method: "POST" })
    const data = await res.json()
    if (data.jaRegistrado) { setEstado("ja_registrado"); return }
    if (res.ok) { setEstado("confirmado"); return }
    setEstado("pronto")
  }

  const userName = authSession?.user?.name

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="text-2xl font-bold tracking-tight">Loja Atibaia</div>
        <div className="text-sm text-muted-foreground">Check-in de Presença</div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sessao && (
          <div className="rounded-lg bg-muted/50 p-3 text-center space-y-1">
            <div className="font-semibold">{formatarData(sessao.data)}</div>
            <Badge variant="outline">{TIPO_LABEL[sessao.tipo] ?? sessao.tipo}</Badge>
            {sessao.descricao && <div className="text-xs text-muted-foreground">{sessao.descricao}</div>}
          </div>
        )}

        {estado === "carregando" && (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Clock className="h-8 w-8 animate-pulse" />
            <span className="text-sm">Carregando…</span>
          </div>
        )}

        {estado === "invalido" && (
          <div className="flex flex-col items-center gap-2 py-4 text-destructive">
            <XCircle className="h-10 w-10" />
            <span className="font-medium">QR Code inválido</span>
            <span className="text-sm text-center text-muted-foreground">Este código não corresponde a nenhuma sessão.</span>
          </div>
        )}

        {estado === "encerrado" && (
          <div className="flex flex-col items-center gap-2 py-4 text-amber-600">
            <Clock className="h-10 w-10" />
            <span className="font-medium">Check-in encerrado</span>
            <span className="text-sm text-center text-muted-foreground">O registro de presença por QR foi fechado pelo secretário.</span>
          </div>
        )}

        {estado === "aguardando_login" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <LogIn className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-center text-muted-foreground">Faça login para confirmar sua presença.</span>
            <Button
              className="w-full"
              onClick={() => signIn(undefined, { callbackUrl: `/checkin/${token}` })}
            >
              Entrar no sistema
            </Button>
          </div>
        )}

        {estado === "sem_vinculo" && (
          <div className="flex flex-col items-center gap-2 py-4 text-destructive">
            <ShieldX className="h-10 w-10" />
            <span className="font-medium">Conta sem vínculo</span>
            <span className="text-sm text-center text-muted-foreground">
              Sua conta não está vinculada a um membro. Fale com o secretário.
            </span>
          </div>
        )}

        {(estado === "pronto" || estado === "confirmando") && (
          <div className="space-y-3">
            <div className="text-center text-sm">
              Olá, <span className="font-semibold">{userName}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={confirmar}
              disabled={estado === "confirmando"}
            >
              {estado === "confirmando" ? "Registrando…" : "✓ Confirmar Presença"}
            </Button>
          </div>
        )}

        {estado === "confirmado" && (
          <div className="flex flex-col items-center gap-2 py-4 text-green-600">
            <CheckCircle className="h-14 w-14" />
            <span className="text-lg font-semibold">Presença confirmada!</span>
            <span className="text-sm text-center text-muted-foreground">Sua presença foi registrada com sucesso.</span>
          </div>
        )}

        {estado === "ja_registrado" && (
          <div className="flex flex-col items-center gap-2 py-4 text-green-600">
            <CheckCircle className="h-14 w-14" />
            <span className="text-lg font-semibold">Já registrado ✓</span>
            <span className="text-sm text-center text-muted-foreground">Sua presença já foi confirmada anteriormente.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
