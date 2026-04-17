"use client"

import { useState, useCallback } from "react"
import { presencaStatusLabels, presencaStatusValues } from "@/lib/validations/session"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Save } from "lucide-react"

const POSICAO_LABEL: Record<string, string> = { MI: "M.I.", CM: "C.M.", MM: "M.M.", AM: "A.M." }

interface PresencaRow {
  memberId: string
  nome: string
  cim: string
  posicao: string
  presenca: { status: string; observacao?: string } | null
}

interface AttendanceTableProps {
  sessionId: string
  rows: PresencaRow[]
  onSaved?: () => void
}

export function AttendanceTable({ sessionId, rows: initialRows, onSaved }: AttendanceTableProps) {
  const [rows, setRows] = useState<PresencaRow[]>(initialRows)
  const [saving, setSaving] = useState(false)

  const updateStatus = useCallback((memberId: string, status: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.memberId === memberId
          ? { ...r, presenca: { ...(r.presenca ?? {}), status } }
          : r
      )
    )
  }, [])

  const updateObs = useCallback((memberId: string, observacao: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.memberId === memberId
          ? { ...r, presenca: { ...(r.presenca ?? { status: "F" }), observacao } }
          : r
      )
    )
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const records = rows
        .filter((r) => r.presenca?.status)
        .map((r) => ({
          memberId: r.memberId,
          status: r.presenca!.status,
          observacao: r.presenca?.observacao ?? null,
        }))

      const res = await fetch(`/api/sessoes/${sessionId}/presenca`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error()
      toast.success("Presenças salvas!")
      onSaved?.()
    } catch {
      toast.error("Erro ao salvar presenças")
    } finally {
      setSaving(false)
    }
  }

  function setAll(status: string) {
    setRows((prev) => prev.map((r) => ({ ...r, presenca: { ...(r.presenca ?? {}), status } })))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Preencher todos:</span>
        <Button variant="outline" size="sm" onClick={() => setAll("P")} className="text-green-700 border-green-300">P - Presente</Button>
        <Button variant="outline" size="sm" onClick={() => setAll("F")} className="text-red-700 border-red-300">F - Falta</Button>
        <Button variant="outline" size="sm" onClick={() => setAll("NV")} className="text-gray-600">NV - Não Válida</Button>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Presenças"}
          </Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left px-4 py-3 font-medium">CIM</th>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium w-16">Pos.</th>
              <th className="text-left px-4 py-3 font-medium w-48">Status</th>
              <th className="text-left px-4 py-3 font-medium">Observação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.memberId} className="border-b hover:bg-muted/20">
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.cim}</td>
                <td className="px-4 py-2 font-medium">{row.nome}</td>
                <td className="px-4 py-2 text-xs">{POSICAO_LABEL[row.posicao] || row.posicao}</td>
                <td className="px-4 py-2">
                  <Select
                    value={row.presenca?.status ?? ""}
                    onValueChange={(v) => updateStatus(row.memberId, v ?? "")}
                  >
                    <SelectTrigger className={`h-8 text-xs ${getStatusColor(row.presenca?.status ?? undefined)}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {presencaStatusValues.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s} — {presencaStatusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    className="h-8 text-xs"
                    value={row.presenca?.observacao ?? ""}
                    onChange={(e) => updateObs(row.memberId, e.target.value)}
                    placeholder="Obs..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((row) => (
          <div key={row.memberId} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{row.nome}</div>
                <div className="text-xs text-muted-foreground">{row.cim} · {POSICAO_LABEL[row.posicao]}</div>
              </div>
              <Select
                value={row.presenca?.status ?? ""}
                onValueChange={(v) => updateStatus(row.memberId, v ?? "")}
              >
                <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(row.presenca?.status ?? undefined)}`}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {presencaStatusValues.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s} — {presencaStatusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getStatusColor(status?: string): string {
  if (!status) return ""
  if (status === "P") return "border-green-300 text-green-800 bg-green-50"
  if (status === "F") return "border-red-300 text-red-800 bg-red-50"
  if (status === "NV") return "border-gray-200 text-gray-500 bg-gray-50"
  return "border-amber-200 text-amber-800 bg-amber-50"
}
