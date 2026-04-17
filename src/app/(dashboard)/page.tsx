import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, CalendarDays, TrendingDown } from "lucide-react"
import { formatarData } from "@/lib/utils/format"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { calcularSituacaoPresenca } from "@/lib/utils/presence"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const currentYear = new Date().getFullYear()
  const yearStart = new Date(`${currentYear}-01-01`)

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

  let negativos = 0
  if (totalSessoes > 0) {
    const members = await prisma.member.findMany({
      where: { situacao: "ATIVO" },
      include: {
        presencas: { where: { sessionId: { in: sessionIds }, status: "F" }, select: { id: true } },
      },
    })
    negativos = members.filter((m) => {
      const { status } = calcularSituacaoPresenca(totalSessoes, m.presencas.length)
      return status === "NEGATIVO"
    }).length
  }

  const stats = [
    { label: "Irmãos Ativos", value: totalAtivos, icon: UserCheck, color: "text-green-600" },
    { label: "Inativos", value: totalInativos, icon: UserX, color: "text-gray-500" },
    { label: "Sessões no Ano", value: sessoesAno, icon: CalendarDays, color: "text-blue-600" },
    { label: "Negativos (ano)", value: negativos, icon: TrendingDown, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Loja Maçônica Itapetininga — {currentYear}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="text-xl font-semibold">{formatarData(ultimaSessao.data)}</div>
                  <Badge variant="outline">
                    {ultimaSessao.tipo === "ORDINARIA" ? "Ordinária" : ultimaSessao.tipo === "MAGNA" ? "Magna" : "Especial"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ultimaSessao._count.presencas} presenças registradas</span>
                </div>
                {ultimaSessao.descricao && (
                  <p className="text-sm text-muted-foreground">{ultimaSessao.descricao}</p>
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
            <Link href="/relatorios/presenca" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}>
              <TrendingDown className="h-4 w-4 mr-2" />Relatório de Presença
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
