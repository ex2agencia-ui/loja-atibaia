"use client"

import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarDays, Users, Download, Upload } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { exportCSV, parseCSV, isoDate } from "@/lib/utils/csv"
import { toast } from "sonner"

const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }

export default function SessoesPage() {
  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetch("/api/sessoes").then((r) => r.json()),
  })

  function handleExport() {
    const sessions = data?.sessions ?? []
    if (!sessions.length) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportCSV("sessoes.csv", sessions.map((s: any) => ({
      data: isoDate(s.data),
      tipo: s.tipo,
      descricao: s.descricao ?? "",
      totalPresencas: s._count?.presencas ?? 0,
    })))
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows.length) { toast.error("CSV vazio ou inválido"); return }
      const res = await fetch("/api/sessoes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: rows }),
      })
      const result = await res.json()
      if (result.errors?.length) {
        toast.warning(`${result.created} criadas — ${result.errors.length} erro(s)`)
      } else {
        toast.success(`${result.created} sessões criadas`)
      }
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessões</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? "—"} sessões registradas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.sessions?.length}>
            <Download className="h-4 w-4 mr-2" />Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />{importing ? "Importando..." : "Importar"}
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Link href="/sessoes/nova" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-2" />Nova Sessão
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {data?.sessions?.map((s: { id: string; data: string; tipo: string; descricao?: string; _count: { presencas: number } }) => (
            <Link key={s.id} href={`/sessoes/${s.id}`} className="block">
              <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-medium">{formatarData(s.data)}</div>
                      {s.descricao && <div className="text-xs text-muted-foreground">{s.descricao}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {s._count.presencas}
                    </div>
                    <Badge variant="outline">{TIPO_LABEL[s.tipo]}</Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
