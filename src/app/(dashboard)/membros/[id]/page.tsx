"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { MemberForm } from "@/components/membros/member-form"
import { AcessoSistemaCard } from "@/components/membros/acesso-sistema-card"
import { MemberFormData } from "@/lib/validations/member"
import { toast } from "sonner"
import Link from "next/link"
import { ChevronLeft, Trash2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatarData } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

export default function EditarMembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: member, isLoading } = useQuery({
    queryKey: ["member", id],
    queryFn: () => fetch(`/api/membros/${id}`).then((r) => r.json()),
  })

  // Busca role do usuário logado para saber se é ADMIN
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then((r) => r.json()),
    staleTime: 60_000,
  })

  async function handleSubmit(data: MemberFormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/membros/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      await qc.invalidateQueries({ queryKey: ["members"] })
      await qc.invalidateQueries({ queryKey: ["member", id] })
      toast.success("Dados atualizados!")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await fetch(`/api/membros/${id}`, { method: "DELETE" })
    await qc.invalidateQueries({ queryKey: ["members"] })
    toast.success("Irmão inativado")
    router.push("/membros")
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>
  if (!member || member.error) return <div>Membro não encontrado</div>

  function toInputDate(d: string | null): string {
    if (!d) return ""
    return new Date(d).toISOString().split("T")[0]
  }

  const defaultValues: Partial<MemberFormData> = {
    ...member,
    dataNascimento: toInputDate(member.dataNascimento),
    dataIniciacao: toInputDate(member.dataIniciacao),
    dataElevacao: toInputDate(member.dataElevacao),
    dataExaltacao: toInputDate(member.dataExaltacao),
    dataInstalacao: toInputDate(member.dataInstalacao),
    dataRegulFiliacao: toInputDate(member.dataRegulFiliacao),
    nascimentoConjuge: toInputDate(member.nascimentoConjuge),
    filhos: member.filhos.map((f: { nome: string; dataNascimento: string | null }) => ({
      nome: f.nome,
      dataNascimento: toInputDate(f.dataNascimento),
    })),
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/membros" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{member.nome}</h1>
            <p className="text-sm text-muted-foreground">CIM {member.cim} · Membro desde {formatarData(member.dataIniciacao)}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-destructive border-destructive hover:bg-destructive hover:text-white")}>
            <Trash2 className="h-4 w-4 mr-1" /> Inativar
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Inativar irmão?</AlertDialogTitle>
              <AlertDialogDescription>
                O irmão será marcado como INATIVO. O histórico de presença será preservado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Inativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <MemberForm defaultValues={defaultValues} onSubmit={handleSubmit} loading={loading} />

      <AcessoSistemaCard
        memberId={id}
        membroNome={member.nome}
        usuario={member.user ?? null}
        isAdmin={meData?.role === "ADMIN"}
        onRefresh={() => qc.invalidateQueries({ queryKey: ["member", id] })}
      />
    </div>
  )
}
