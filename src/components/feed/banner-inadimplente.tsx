"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, X, ArrowRight } from "lucide-react"
import Link from "next/link"

const SESSION_KEY = "banner-inadimplente-dismissed"

export function BannerInadimplente({ memberId }: { memberId: string }) {
  const [dismissed, setDismissed] = useState(true) // começa oculto até confirmar

  useEffect(() => {
    // Verifica sessionStorage só no client
    setDismissed(!!sessionStorage.getItem(SESSION_KEY))
  }, [])

  const { data } = useQuery<{ totais: { vencidas: number; totalInadimplente: number } }>({
    queryKey: ["meu-extrato-banner", memberId],
    queryFn: () =>
      fetch(`/api/financeiro/mensalidades/membro/${memberId}`).then((r) => r.json()),
    staleTime: 300_000,
    enabled: !dismissed,
  })

  const vencidas = data?.totais?.vencidas ?? 0
  const totalAberto = data?.totais?.totalInadimplente ?? 0

  if (dismissed || vencidas === 0) return null

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1")
    setDismissed(true)
  }

  const valorFormatado = totalAberto.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 flex items-center gap-3 text-yellow-900">
      <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
      <p className="text-sm flex-1">
        Ir., você tem{" "}
        <span className="font-semibold">
          {vencidas} mensalidade{vencidas > 1 ? "s" : ""} em aberto
        </span>{" "}
        ({valorFormatado}). Fique em dia com a Loja! 🤝
      </p>
      <Link
        href="/perfil?tab=financeiro"
        className="flex items-center gap-1 text-xs font-semibold text-yellow-800 hover:text-yellow-900 shrink-0 underline underline-offset-2"
      >
        Ver situação <ArrowRight className="h-3 w-3" />
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-yellow-500 hover:text-yellow-700 shrink-0 ml-1"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
