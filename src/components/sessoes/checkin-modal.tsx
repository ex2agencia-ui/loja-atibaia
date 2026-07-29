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
}

export function CheckinModal({ sessionId, checkInToken, checkInAberto, onToggle }: Props) {
  const [toggling, setToggling] = useState(false)
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkin/${checkInToken}`

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
    window.print()
  }

  return (
    <>
      {/* CSS de impressão — esconde tudo exceto o QR */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #checkin-print-area { display: flex !important; }
        }
        #checkin-print-area { display: none; }
      `}</style>

      {/* Área oculta só para impressão */}
      <div id="checkin-print-area" className="fixed inset-0 flex-col items-center justify-center gap-6 bg-white z-[9999] p-12">
        <div className="text-2xl font-bold text-center">Loja Atibaia — Check-in de Presença</div>
        <QRCodeSVG value={url} size={320} />
        <div className="text-sm text-gray-500 text-center">Escaneie com o celular para confirmar sua presença</div>
      </div>

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

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-lg border p-4 bg-white">
              <QRCodeSVG value={url} size={220} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Projete ou imprima para os irmãos escanearem na entrada
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleToggle}
              disabled={toggling}
            >
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
    </>
  )
}
