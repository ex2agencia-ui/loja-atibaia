"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CalendarDays, BarChart3, Table2, Cake, Quote } from "lucide-react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membros", label: "Irmãos", icon: Users },
  { href: "/sessoes", label: "Sessões", icon: CalendarDays },
  { href: "/aniversarios", label: "Aniversários", icon: Cake },
  { href: "/frases", label: "Frases", icon: Quote },
  { href: "/relatorios/presenca", label: "Rel. Presença", icon: BarChart3 },
  { href: "/relatorios/historico", label: "Histórico", icon: Table2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-900 text-slate-100 shrink-0">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
