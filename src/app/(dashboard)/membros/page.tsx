"use client"

import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MemberTable } from "@/components/membros/member-table"
import { Plus, Search, Download, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { exportCSV, parseCSV, isoDate } from "@/lib/utils/csv"
import { toast } from "sonner"

export default function MembrosPage() {
  const [search, setSearch] = useState("")
  const [situacao, setSituacao] = useState("ATIVO")
  const [posicao, setPosicao] = useState("")
  const [importing, setImporting] = useState(false)
  const [importingSobrinhos, setImportingSobrinhos] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const importSobrinhosRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const params = new URLSearchParams()
  if (situacao) params.set("situacao", situacao)
  if (posicao) params.set("posicao", posicao)
  if (search) params.set("search", search)

  const { data, isLoading } = useQuery({
    queryKey: ["members", situacao, posicao, search],
    queryFn: () => fetch(`/api/membros?${params}`).then((r) => r.json()),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleExport() {
    const members = data?.members ?? []
    if (!members.length) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportCSV("irmaos.csv", members.map((m: any) => ({
      cim: m.cim,
      situacao: m.situacao,
      nome: m.nome,
      posicao: m.posicao,
      dataNascimento: isoDate(m.dataNascimento),
      dataIniciacao: isoDate(m.dataIniciacao),
      dataElevacao: isoDate(m.dataElevacao),
      dataExaltacao: isoDate(m.dataExaltacao),
      dataInstalacao: isoDate(m.dataInstalacao),
      dataRegulFiliacao: isoDate(m.dataRegulFiliacao),
      telefone: m.telefone ?? "",
      isWhatsapp: m.isWhatsapp ? "true" : "false",
      email: m.email ?? "",
      rua: m.rua ?? "",
      numero: m.numero ?? "",
      complemento: m.complemento ?? "",
      bairro: m.bairro ?? "",
      cep: m.cep ?? "",
      cidade: m.cidade ?? "",
      ocupacao: m.ocupacao ?? "",
      notasOcupacao: m.notasOcupacao ?? "",
      conjuge: m.conjuge ?? "",
      nascimentoConjuge: isoDate(m.nascimentoConjuge),
      dataCasamento: isoDate(m.dataCasamento),
    })))
  }

  async function handleExportSobrinhos() {
    try {
      const res = await fetch("/api/membros/filhos")
      const result = await res.json()
      const filhos = result.filhos ?? []
      if (!filhos.length) { toast.error("Nenhum sobrinho cadastrado"); return }
      exportCSV("sobrinhos.csv", filhos.map((f: { cim: string; nomeIrmao: string; nome: string; dataNascimento: string }) => ({
        cim: f.cim,
        nomeIrmao: f.nomeIrmao,
        nome: f.nome,
        dataNascimento: f.dataNascimento,
      })))
    } catch {
      toast.error("Erro ao exportar sobrinhos")
    }
  }

  async function handleImportSobrinhos(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportingSobrinhos(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows.length) { toast.error("CSV vazio ou inválido"); return }
      const res = await fetch("/api/membros/filhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filhos: rows }),
      })
      const result = await res.json()
      if (result.errors?.length) {
        toast.warning(`${result.created} criados, ${result.updated} atualizados — ${result.errors.length} erro(s)`)
      } else {
        toast.success(`${result.created} criados, ${result.updated} atualizados`)
      }
      queryClient.invalidateQueries({ queryKey: ["members"] })
    } finally {
      setImportingSobrinhos(false)
      e.target.value = ""
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows.length) { toast.error("CSV vazio ou inválido"); return }
      const res = await fetch("/api/membros/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: rows }),
      })
      const result = await res.json()
      if (result.errors?.length) {
        toast.warning(`${result.created} criados, ${result.updated} atualizados — ${result.errors.length} erro(s)`)
      } else {
        toast.success(`${result.created} criados, ${result.updated} atualizados`)
      }
      queryClient.invalidateQueries({ queryKey: ["members"] })
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Irmãos</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? "—"} membros cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.members?.length}>
            <Download className="h-4 w-4 mr-2" />Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />{importing ? "Importando..." : "Importar"}
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={handleExportSobrinhos}>
            <Download className="h-4 w-4 mr-2" />Exportar Sobrinhos
          </Button>
          <Button variant="outline" size="sm" onClick={() => importSobrinhosRef.current?.click()} disabled={importingSobrinhos}>
            <Upload className="h-4 w-4 mr-2" />{importingSobrinhos ? "Importando..." : "Importar Sobrinhos"}
          </Button>
          <input ref={importSobrinhosRef} type="file" accept=".csv" className="hidden" onChange={handleImportSobrinhos} />
          <Link href="/membros/novo" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-2" />Novo Irmão
          </Link>
        </div>
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
