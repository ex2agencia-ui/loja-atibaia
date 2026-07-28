"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { MemberForm } from "@/components/membros/member-form"
import { MemberFormData } from "@/lib/validations/member"
import { toast } from "sonner"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NovoMembroPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(data: MemberFormData) {
    setLoading(true)
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err.error))
      }
      const created = await res.json()
      await qc.invalidateQueries({ queryKey: ["members"] })
      toast.success("Irmão cadastrado! Configure o acesso ao sistema abaixo.")
      router.push(`/membros/${created.id}`)
    } catch (e) {
      toast.error("Erro ao cadastrar: " + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/membros" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Novo Irmão</h1>
      </div>
      <MemberForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
