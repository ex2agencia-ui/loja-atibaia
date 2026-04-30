"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PresenceCalculator({ defaultTotal }: { defaultTotal: number }) {
  const [total, setTotal] = useState(defaultTotal)
  const [presentes, setPresentes] = useState(0)

  const pct = total > 0 ? Math.min(100, Math.round((presentes / total) * 100)) : 0
  const quorum = total > 0 ? Math.ceil(total / 2) : 0
  const atingiu = presentes >= quorum

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Total de irmãos</Label>
          <Input
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Presentes</Label>
          <Input
            type="number"
            min={0}
            value={presentes}
            onChange={(e) => setPresentes(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Quórum mínimo: {quorum}</span>
          <span className="text-3xl font-bold">{pct}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${atingiu ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`text-xs font-medium text-right ${atingiu ? "text-green-600" : "text-red-600"}`}>
          {atingiu ? "Quórum atingido" : `Faltam ${quorum - presentes} para quórum`}
        </div>
      </div>
    </div>
  )
}
