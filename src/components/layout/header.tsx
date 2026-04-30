"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Shield, User, LogOut, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  user: {
    name?: string | null
    email?: string | null
  }
  vercelUrl?: string
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
  return email?.[0]?.toUpperCase() ?? "U"
}

export function Header({ user }: Props) {
  const router = useRouter()

  return (
    <header className="h-14 bg-black border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-sm text-white">Loja Itapetininga</div>
          <div className="text-xs text-white/70 hidden sm:block">Gestão Maçônica</div>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/20 transition-colors outline-none cursor-pointer">
          <div className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(user.name, user.email)}
          </div>
          <span className="text-sm text-white hidden sm:block max-w-[160px] truncate">
            {user.name ?? user.email}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 mb-1 border-b border-border">
            <div className="text-sm font-semibold truncate">{user.name ?? "Usuário"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <DropdownMenuItem onClick={() => router.push("/perfil")}>
            <User className="h-4 w-4 mr-2" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
