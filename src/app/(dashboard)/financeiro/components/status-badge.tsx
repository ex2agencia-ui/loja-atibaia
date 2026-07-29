import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  PAGO:      { label: "Pago",      class: "bg-green-100 text-green-800 border-green-200" },
  PENDENTE:  { label: "Pendente",  class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  VENCIDO:   { label: "Vencido",   class: "bg-red-100 text-red-800 border-red-200" },
  CANCELADO: { label: "Isento",    class: "bg-slate-100 text-slate-600 border-slate-200" },
} as const

type Status = keyof typeof STATUS_CONFIG

export function StatusBadge({ status, isento }: { status: string; isento?: boolean }) {
  if (isento && status !== "PAGO") return (
    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Isento</Badge>
  )
  const cfg = STATUS_CONFIG[status as Status] ?? { label: status, class: "" }
  return (
    <Badge variant="outline" className={cn(cfg.class)}>{cfg.label}</Badge>
  )
}
