"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MemberTable } from "@/components/membros/member-table"
import { Plus, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function MembrosPage() {
  const [search, setSearch] = useState("")
  const [situacao, setSituacao] = useState("ATIVO")
  const [posicao, setPosicao] = useState("")

  const params = new URLSearchParams()
  if (situacao) params.set("situacao", situacao)
  if (posicao) params.set("posicao", posicao)
  if (search) params.set("search", search)

  const { data, isLoading } = useQuery({
    queryKey: ["members", situacao, posicao, search],
    queryFn: () => fetch(`/api/membros?${params}`).then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Irmãos</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? "—"} membros cadastrados
          </p>
        </div>
        <Link href="/membros/novo" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />Novo Irmão
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CIM..."
            className="pl-9"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <Select value={situacao} onValueChange={(v) => setSituacao(v ?? "")}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATIVO">Ativos</SelectItem>
            <SelectItem value="INATIVO">Inativos</SelectItem>
            <SelectItem value="">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={posicao} onValueChange={(v) => setPosicao(v ?? "")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Posição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="MI">M.I.</SelectItem>
            <SelectItem value="MM">Mestre</SelectItem>
            <SelectItem value="CM">Companheiro</SelectItem>
            <SelectItem value="AM">Aprendiz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <MemberTable members={data?.members ?? []} />
      )}
    </div>
  )
}
