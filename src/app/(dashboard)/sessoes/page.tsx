"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarDays, Users } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const TIPO_LABEL: Record<string, string> = { ORDINARIA: "Ordinária", MAGNA: "Magna", ESPECIAL: "Especial" }

export default function SessoesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetch("/api/sessoes").then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessões</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? "—"} sessões registradas</p>
        </div>
        <Link href="/sessoes/nova" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />Nova Sessão
        </Link>
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
