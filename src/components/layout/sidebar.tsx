"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CalendarDays, BarChart3, Cake, Quote, User, Briefcase, Newspaper, Bell, Wallet, Settings, Plug, MessageSquare } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
  badge?: boolean
}

const allNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/feed", label: "Mural", icon: Newspaper },
  { href: "/comunicados", label: "Comunicados", icon: Bell, badge: true },
  { href: "/perfil", label: "Meu Perfil", icon: User },
  { href: "/membros", label: "Irmãos", icon: Users, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/sessoes", label: "Sessões", icon: CalendarDays },
  { href: "/aniversarios", label: "Aniversários", icon: Cake, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/frases", label: "Frases", icon: Quote, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA"] },
  { href: "/classificados", label: "Classificados", icon: Briefcase },
  { href: "/relatorios/presenca", label: "Relatórios", icon: BarChart3, roles: ["ADMIN", "SECRETARIO", "FINANCEIRO"] },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["ADMIN", "FINANCEIRO"] },
  { href: "/admin/config", label: "Configurações", icon: Settings, roles: ["ADMIN"] },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug, roles: ["ADMIN"] },
  { href: "/admin/mensageria", label: "Mensageria", icon: MessageSquare, roles: ["ADMIN"] },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  const { data: naoLidos } = useQuery({
    queryKey: ["nao-lidos"],
    queryFn: () => fetch("/api/comunicados/nao-lidos").then(r => r.json()).then(d => d.count ?? 0),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const nav = allNav.filter((item) => {
    if (!item.roles) return true
    return role && item.roles.includes(role)
  })

  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-800 text-slate-100 shrink-0">
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          const count = badge ? (naoLidos ?? 0) : 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
