"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, KeyRound } from "lucide-react"

const schema = z
  .object({
    senhaAtual: z.string().optional(),
    novaSenha: z.string().min(6, "Mínimo 6 caracteres"),
    confirmar: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: "As senhas não conferem",
    path: ["confirmar"],
  })

type FormData = z.infer<typeof schema>

export default function TrocarSenhaPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mustChange = (session?.user as any)?.mustChangePassword as boolean

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const errors = form.formState.errors

  async function onSubmit(values: FormData) {
    setSaving(true)
    try {
      const res = await fetch("/api/usuario/senha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual: values.senhaAtual,
          novaSenha: values.novaSenha,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Erro ao trocar senha")
        return
      }

      toast.success("Senha alterada com sucesso")
      // Força re-leitura do token no banco (trigger jwt callback sem user arg)
      await update({})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (session?.user as any)?.role as string
      // Pequeno delay para o cookie ser re-emitido antes da navegação
      await new Promise(r => setTimeout(r, 300))
      router.push(role === "MEMBRO" ? "/feed" : "/")
    } catch {
      toast.error("Erro ao trocar senha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <CardTitle>Trocar Senha</CardTitle>
          </div>
          {mustChange && (
            <CardDescription className="text-amber-600">
              Por segurança, você deve definir uma nova senha antes de continuar.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!mustChange && (
              <div className="space-y-1.5">
                <Label>Senha atual</Label>
                <Input type="password" {...form.register("senhaAtual")} autoComplete="current-password" />
                {errors.senhaAtual && <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input type="password" {...form.register("novaSenha")} autoComplete="new-password" />
              {errors.novaSenha && <p className="text-xs text-destructive">{errors.novaSenha.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input type="password" {...form.register("confirmar")} autoComplete="new-password" />
              {errors.confirmar && <p className="text-xs text-destructive">{errors.confirmar.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
