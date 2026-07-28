"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CalendarDays, BarChart3, Cake, Quote, User, Briefcase, Newspaper } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

const allNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/feed", label: "Mural", icon: Newspaper },
  { href: "/perfil", label: "Meu Perfil", icon: User },
  { href: "/membros", label: "Irmãos", icon: Users, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/sessoes", label: "Sessões", icon: CalendarDays },
  { href: "/aniversarios", label: "Aniversários", icon: Cake, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA", "FINANCEIRO"] },
  { href: "/frases", label: "Frases", icon: Quote, roles: ["ADMIN", "SECRETARIO", "CHANCELARIA"] },
  { href: "/classificados", label: "Classificados", icon: Briefcase },
  { href: "/relatorios/presenca", label: "Relatórios", icon: BarChart3, roles: ["ADMIN", "SECRETARIO", "FINANCEIRO"] },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  const nav = allNav.filter((item) => {
    if (!item.roles) return true
    return role && item.roles.includes(role)
  })

  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-800 text-slate-100 shrink-0">
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
