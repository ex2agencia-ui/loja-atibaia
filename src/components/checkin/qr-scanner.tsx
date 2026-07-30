"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

type Props = {
  onScan: (token: string) => void
  active: boolean
}

export function QrScanner({ onScan, active }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!active) return

    let scanner: InstanceType<typeof Html5Qrcode> | null = null
    let isMounted = true

    try {
      scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner
    } catch {
      return
    }

    const localScanner = scanner

    localScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => {
        const match = text.match(/\/checkin\/([a-f0-9-]{36})/)
        const token = match ? match[1] : text.trim()
        if (token && isMounted) {
          started.current = false
          localScanner.stop().catch(() => {})
          onScan(token)
        }
      },
      () => {}
    ).then(() => {
      if (isMounted) started.current = true
    }).catch((e: Error) => {
      if (!isMounted) return
      setErro(e.message.toLowerCase().includes("permission")
        ? "Permissão de câmera negada. Libere o acesso nas configurações do navegador."
        : "Não foi possível iniciar a câmera.")
    })

    return () => {
      isMounted = false
      if (started.current) {
        started.current = false
        localScanner.stop().catch(() => {})
      }
    }
  }, [active, onScan])

  if (erro) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-center">
        {erro}
      </div>
    )
  }

  return (
    <div className="relative">
      <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
      <p className="text-xs text-center text-muted-foreground mt-2">
        Aponte para o QR Code impresso na entrada
      </p>
    </div>
  )
}
