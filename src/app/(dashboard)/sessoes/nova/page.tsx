"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sessionSchema, SessionFormData } from "@/lib/validations/session"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NovaSessaoPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: { tipo: "ORDINARIA" },
  })

  async function onSubmit(data: SessionFormData) {
    setLoading(true)
    try {
      const res = await fetch("/api/sessoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const session = await res.json()
      await qc.invalidateQueries({ queryKey: ["sessions"] })
      toast.success("Sessão criada!")
      router.push(`/sessoes/${session.id}`)
    } catch {
      toast.error("Erro ao criar sessão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/sessoes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nova Sessão</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Dados da Sessão</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input type="date" {...form.register("data")} />
              {form.formState.errors.data && (
                <p className="text-xs text-destructive">{form.formState.errors.data.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Sessão</Label>
              <Controller control={form.control} name="tipo" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                    <SelectItem value="MAGNA">Magna</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea {...form.register("descricao")} rows={2} placeholder="Observações sobre a sessão..." />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Sessão"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
