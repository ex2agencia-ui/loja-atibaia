import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, CalendarDays, TrendingDown, Cake, Heart, Baby, Quote } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { calcularSituacaoPresenca } from "@/lib/utils/presence"
import { cn } from "@/lib/utils"
import { MemberPieChart } from "@/components/dashboard/MemberPieChart"
import { PresenceCalculator } from "@/components/dashboard/PresenceCalculator"

export const dynamic = "force-dynamic"

function occurrenceInRange(birthday: Date, start: Date, end: Date): Date | null {
  const month = birthday.getUTCMonth()
  const day = birthday.getUTCDate()
  for (const year of new Set([start.getFullYear(), end.getFullYear()])) {
    const d = new Date(year, month, day)
    if (d >= start && d <= end) return d
  }
  return null
}

const TIPO_CONFIG = {
  IRMAO: { label: "Irmão", icon: Users, color: "bg-blue-100 text-blue-800" },
  CONJUGE: { label: "Cônjuge", icon: Heart, color: "bg-rose-100 text-rose-800" },
  FILHO: { label: "Filho/a", icon: Baby, color: "bg-green-100 text-green-800" },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const currentYear = new Date().getFullYear()
  const yearStart = new Date(`${currentYear}-01-01`)

  const todasFrases = await prisma.frase.findMany({ where: { ativo: true } })
  const fraseDestaque = todasFrases.length > 0 ? todasFrases[Math.floor(Math.random() * todasFrases.length)] : null

  const [totalAtivos, totalInativos, sessoesAno, ultimaSessao] = await Promise.all([
    prisma.member.count({ where: { situacao: "ATIVO" } }),
    prisma.member.count({ where: { situacao: "INATIVO" } }),
    prisma.lojaSession.count({ where: { data: { gte: yearStart } } }),
    prisma.lojaSession.findFirst({
      orderBy: { data: "desc" },
      include: { _count: { select: { presencas: true } } },
    }),
  ])

  const sessoes = await prisma.lojaSession.findMany({
    where: { data: { gte: yearStart } },
    select: { id: true },
  })
  const sessionIds = sessoes.map((s) => s.id)
  const totalSessoes = sessionIds.length

  const members = await prisma.member.findMany({
    where: { situacao: "ATIVO" },
    include: {
      presencas: { where: { sessionId: { in: sessionIds }, status: "F" }, select: { id: true } },
      filhos: true,
    },
    orderBy: { nome: "asc" },
  })

  let negativos = 0
  if (totalSessoes > 0) {
    negativos = members.filter((m) => {
      const { status } = calcularSituacaoPresenca(totalSessoes, m.presencas.length)
      return status === "NEGATIVO"
    }).length
  }

  const agora = new Date()
  agora.setHours(23, 59, 59, 999)
  const inicioAniv = ultimaSessao
    ? (() => { const d = new Date(ultimaSessao.data); d.setHours(0, 0, 0, 0); return d })()
    : (() => { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d })()

  type Aniversariante = {
    tipo: "IRMAO" | "CONJUGE" | "FILHO"
    nome: string
    aniversario: Date
    idade: number
    contexto?: string
  }

  const aniversariantes: Aniversariante[] = []
  for (const m of members) {
    if (m.dataNascimento) {
      const occ = occurrenceInRange(m.dataNascimento, inicioAniv, agora)
      if (occ) aniversariantes.push({ tipo: "IRMAO", nome: m.nome, aniversario: occ, idade: occ.getFullYear() - m.dataNascimento.getUTCFullYear() })
    }
    if (m.nascimentoConjuge && m.conjuge) {
      const occ = occurrenceInRange(m.nascimentoConjuge, inicioAniv, agora)
      if (occ) aniversariantes.push({ tipo: "CONJUGE", nome: m.conjuge, aniversario: occ, idade: occ.getFullYear() - m.nascimentoConjuge.getUTCFullYear(), contexto: m.nome })
    }
    for (const f of m.filhos) {
      if (f.dataNascimento) {
        const occ = occurrenceInRange(f.dataNascimento, inicioAniv, agora)
        if (occ) aniversariantes.push({ tipo: "FILHO", nome: f.nome, aniversario: occ, idade: occ.getFullYear() - f.dataNascimento.getUTCFullYear(), contexto: m.nome })
      }
    }
  }
  aniversariantes.sort((a, b) => a.aniversario.getTime() - b.aniversario.getTime())

  const total = totalAtivos + totalInativos

  const stats = [
    { label: "Total de Sócios", value: total, icon: Users, color: "text-slate-600" },
    { label: "Irmãos Ativos", value: totalAtivos, icon: UserCheck, color: "text-green-600" },
    { label: "Inativos", value: totalInativos, icon: UserX, color: "text-gray-400" },
    { label: "Negativos (ano)", value: negativos, icon: TrendingDown, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Loja Maçônica Itapetinga — {currentYear}</p>
      </div>

      {/* 1. Frase do Dia */}
      {fraseDestaque && (
        <div className="rounded-xl px-6 py-6 flex gap-4 items-start" style={{ background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 60%, #1e4d8c 100%)" }}>
          <Quote className="h-6 w-6 shrink-0 mt-0.5" style={{ color: "#7eb3f5" }} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7eb3f5" }}>Frase do Dia</span>
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "#3a6bbf", color: "#a8c8f8", backgroundColor: "rgba(58,107,191,0.25)" }}>{fraseDestaque.tema}</span>
            </div>
            <p className="font-medium leading-relaxed italic text-white" style={{ fontSize: 28 }}>{fraseDestaque.texto}</p>
            <p className="mt-3 text-sm" style={{ color: "#a8c8f8" }}>
              — {fraseDestaque.autor}{fraseDestaque.descricaoAutor ? <span style={{ color: "#7eb3f5" }}> ({fraseDestaque.descricaoAutor})</span> : ""}
            </p>
          </div>
        </div>
      )}

      {/* 2. Composição dos Membros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Composição dos Membros</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberPieChart ativos={totalAtivos} negativos={negativos} inativos={totalInativos} total={total} />
        </CardContent>
      </Card>

      {/* 3. Calculadora + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: "#cadcf1" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calculadora de Quórum</CardTitle>
          </CardHeader>
          <CardContent>
            <PresenceCalculator defaultTotal={totalAtivos} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 content-start">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Aniversariantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="h-4 w-4 text-amber-500" />
              Aniversariantes
            </CardTitle>
            {ultimaSessao && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Desde {formatarData(ultimaSessao.data)}
              </p>
            )}
          </div>
          <Link href="/aniversarios" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Ver todos
          </Link>
        </CardHeader>
        <CardContent>
          {aniversariantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cake className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhum aniversário no período</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {aniversariantes.map((a, i) => {
                const cfg = TIPO_CONFIG[a.tipo]
                const Icon = cfg.icon
                const diaMes = a.aniversario.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                const relacao = a.tipo === "IRMAO"
                  ? "Irmão"
                  : a.tipo === "CONJUGE"
                    ? `Cônjuge de ${a.contexto}`
                    : `Filho/a de ${a.contexto}`
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{a.nome}</div>
                      <div className="text-xs text-muted-foreground truncate">{relacao}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={`${cfg.color} text-xs block`}>{diaMes}</Badge>
                      <span className="text-xs text-muted-foreground">{a.idade} anos</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5 + 6. Última Sessão + Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Última Sessão</CardTitle>
            <Link href="/sessoes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {ultimaSessao ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{formatarData(ultimaSessao.data)}</div>
                  <Badge variant="outline">
                    {ultimaSessao.tipo === "ORDINARIA" ? "Ordinária" : ultimaSessao.tipo === "MAGNA" ? "Magna" : "Especial"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ultimaSessao._count.presencas} presenças</span>
                </div>
                {ultimaSessao.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{ultimaSessao.descricao}</p>
                )}
                <Link href={`/sessoes/${ultimaSessao.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                  Ver lista de presença
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma sessão registrada</p>
                <Link href="/sessoes/nova" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
                  Criar primeira sessão
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/sessoes/nova" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
              <CalendarDays className="h-4 w-4 mr-2" />Nova Sessão
            </Link>
            <Link href="/membros/novo" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
              <Users className="h-4 w-4 mr-2" />Novo Irmão
            </Link>
            <Link href="/aniversarios" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
              <Cake className="h-4 w-4 mr-2" />Ver Aniversários
            </Link>
            <Link href="/relatorios/presenca" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
              <TrendingDown className="h-4 w-4 mr-2" />Rel. de Presença
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
