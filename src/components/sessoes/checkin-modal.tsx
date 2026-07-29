"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { QrCode, Printer, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"

type Props = {
  sessionId: string
  checkInToken: string
  checkInAberto: boolean
  onToggle: (aberto: boolean) => void
  sessaoData?: string   // ISO string da data da sessão
  sessaoTipo?: string
}

const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }

export function CheckinModal({ sessionId, checkInToken, checkInAberto, onToggle, sessaoData, sessaoTipo }: Props) {
  const [toggling, setToggling] = useState(false)
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/checkin/${checkInToken}`

  const dataFormatada = sessaoData
    ? new Date(sessaoData).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : ""
  const tipoLabel = TIPO_LABEL[sessaoTipo ?? ""] ?? sessaoTipo ?? ""

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await fetch(`/api/sessoes/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInAberto: !checkInAberto }),
      })
      if (!res.ok) throw new Error()
      onToggle(!checkInAberto)
      toast.success(checkInAberto ? "Check-in encerrado" : "Check-in aberto")
    } catch {
      toast.error("Erro ao alterar check-in")
    } finally {
      setToggling(false)
    }
  }

  function handlePrint() {
    // Gera SVG do QR em string para embutir no HTML de impressão
    const svgEl = document.getElementById("qr-print-svg")
    const svgHtml = svgEl ? svgEl.outerHTML : ""

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Check-in — ${dataFormatada}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #fff;
      padding: 40px;
      text-align: center;
    }
    .loja { font-size: 18px; color: #555; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .tipo { font-size: 22px; color: #333; margin-bottom: 4px; }
    .data { font-size: 42px; font-weight: bold; color: #111; margin-bottom: 32px; text-transform: capitalize; }
    .qr { border: 3px solid #111; padding: 20px; border-radius: 12px; background: #fff; margin-bottom: 28px; }
    .instrucao { font-size: 16px; color: #444; max-width: 320px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="loja">Loja Maçônica Itapetininga</div>
  <div class="tipo">Sessão ${tipoLabel}</div>
  <div class="data">${dataFormatada}</div>
  <div class="qr">${svgHtml}</div>
  <div class="instrucao">Escaneie com o celular para confirmar sua presença</div>
</body>
</html>`

    const win = window.open("", "_blank", "width=700,height=900")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm"><QrCode className="h-4 w-4 mr-2" />QR Check-in</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Check-in por QR Code
            <Badge variant={checkInAberto ? "default" : "secondary"} className={checkInAberto ? "bg-green-600" : ""}>
              {checkInAberto ? "Aberto" : "Encerrado"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {dataFormatada && (
          <p className="text-sm font-medium text-center capitalize -mb-2">{dataFormatada}</p>
        )}

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-lg border p-4 bg-white">
            <QRCodeSVG id="qr-print-svg" value={url} size={220} />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Projete ou imprima para os irmãos escanearem na entrada
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleToggle} disabled={toggling}>
            {checkInAberto
              ? <><PowerOff className="h-4 w-4 mr-2" />Encerrar</>
              : <><Power className="h-4 w-4 mr-2" />Abrir</>
            }
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
