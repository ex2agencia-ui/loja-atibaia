"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CalendarDays, BarChart3, Table2 } from "lucide-react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membros", label: "Irmãos", icon: Users },
  { href: "/sessoes", label: "Sessões", icon: CalendarDays },
  { href: "/relatorios/presenca", label: "Relatório", icon: BarChart3 },
  { href: "/relatorios/historico", label: "Histórico", icon: Table2 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50">
      <div className="flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "text-amber-400"
                : "text-slate-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
