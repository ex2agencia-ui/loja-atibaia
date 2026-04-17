"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CalendarDays, BarChart3, Shield, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/membros", label: "Irmãos", icon: Users },
  { href: "/sessoes", label: "Sessões", icon: CalendarDays },
  { href: "/relatorios/presenca", label: "Relatório", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-900 text-slate-100 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <Shield className="h-6 w-6 text-amber-400 shrink-0" />
        <div className="leading-tight">
          <div className="font-semibold text-sm">Loja Itapetininga</div>
          <div className="text-xs text-slate-400">Gestão Maçônica</div>
        </div>
      </div>

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

      <div className="p-3 border-t border-slate-700">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
