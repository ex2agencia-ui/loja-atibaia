"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
      <h2 className="text-xl font-semibold text-destructive">Erro ao carregar</h2>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      {error.digest && <p className="text-xs text-muted-foreground font-mono">{error.digest}</p>}
      <Button onClick={reset} variant="outline">Tentar novamente</Button>
    </div>
  )
}
