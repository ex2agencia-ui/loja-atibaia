"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, QrCode, RotateCcw } from "lucide-react"

const QrScanner = dynamic(
  () => import("@/components/checkin/qr-scanner").then(m => m.QrScanner),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando câmera…</div> }
)

type Estado = "idle" | "scanning" | "confirmando" | "confirmado" | "ja_registrado" | "encerrado" | "erro"

export default function CheckinPage() {
  const { data: auth } = useSession()
  const [estado, setEstado] = useState<Estado>("idle")
  const [sessaoInfo, setSessaoInfo] = useState<{ data: string; tipo: string; descricao?: string } | null>(null)
  const [erroMsg, setErroMsg] = useState("")

  const memberId = (auth?.user as { memberId?: string | null })?.memberId

  const handleScan = useCallback(async (token: string) => {
    setEstado("confirmando")

    // Busca info da sessão
    const infoRes = await fetch(`/api/checkin/${token}`)
    if (!infoRes.ok) { setEstado("erro"); setErroMsg("QR Code inválido ou expirado."); return }
    const info = await infoRes.json()
    setSessaoInfo(info)

    if (!info.checkInAberto) { setEstado("encerrado"); return }

    // Confirma presença
    const res = await fetch(`/api/checkin/${token}`, { method: "POST" })
    const data = await res.json()

    if (data.jaRegistrado) { setEstado("ja_registrado"); return }
    if (res.ok && data.ok) { setEstado("confirmado"); return }
    if (res.status === 403) { setEstado("encerrado"); return }

    setEstado("erro")
    setErroMsg(data.error ?? "Erro ao registrar presença.")
  }, [])

  function reiniciar() {
    setEstado("scanning")
    setSessaoInfo(null)
    setErroMsg("")
  }

  const dataFormatada = sessaoInfo?.data
    ? new Date(sessaoInfo.data).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : ""

  const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <QrCode className="h-6 w-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-in</h1>
          <p className="text-sm text-muted-foreground">Confirme sua presença na sessão</p>
        </div>
      </div>

      {!memberId && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="font-medium">Conta não vinculada</p>
            <p className="text-sm text-muted-foreground">Sua conta não está vinculada a um membro. Fale com o secretário.</p>
          </CardContent>
        </Card>
      )}

      {memberId && estado === "idle" && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <QrCode className="h-16 w-16 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground text-center">
              Toque no botão abaixo e aponte a câmera para o QR Code impresso na entrada da sessão.
            </p>
            <Button size="lg" className="w-full" onClick={() => setEstado("scanning")}>
              <QrCode className="h-5 w-5 mr-2" />
              Escanear QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {memberId && estado === "scanning" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aponte para o QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QrScanner onScan={handleScan} active={estado === "scanning"} />
            <Button variant="outline" size="sm" className="w-full" onClick={() => setEstado("idle")}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {estado === "confirmando" && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Clock className="h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Registrando presença…</p>
          </CardContent>
        </Card>
      )}

      {estado === "confirmado" && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-green-600">
            <CheckCircle className="h-16 w-16" />
            <p className="text-xl font-bold">Presença confirmada!</p>
            {dataFormatada && (
              <p className="text-sm text-center text-muted-foreground capitalize">
                Sessão {TIPO_LABEL[sessaoInfo?.tipo ?? ""] ?? ""} — {dataFormatada}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {estado === "ja_registrado" && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-green-600">
            <CheckCircle className="h-16 w-16" />
            <p className="text-xl font-bold">Já registrado ✓</p>
            {dataFormatada && (
              <p className="text-sm text-center text-muted-foreground capitalize">
                Sua presença já foi confirmada nesta sessão.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {estado === "encerrado" && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-amber-600">
            <Clock className="h-12 w-12" />
            <p className="text-lg font-semibold">Check-in encerrado</p>
            <p className="text-sm text-center text-muted-foreground">O secretário encerrou o registro de presença para esta sessão.</p>
            <Button variant="outline" size="sm" onClick={reiniciar}>
              <RotateCcw className="h-4 w-4 mr-2" />Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {estado === "erro" && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-destructive">
            <XCircle className="h-12 w-12" />
            <p className="text-lg font-semibold">Erro</p>
            <p className="text-sm text-center text-muted-foreground">{erroMsg}</p>
            <Button variant="outline" size="sm" onClick={reiniciar}>
              <RotateCcw className="h-4 w-4 mr-2" />Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
