import { Briefcase, ShoppingBag, Handshake, Search } from "lucide-react"

export const CATEGORIA_CONFIG = {
  SERVICO:      { label: "Serviço",       icon: Briefcase,   color: "bg-blue-100 text-blue-700 border-blue-200" },
  PRODUTO:      { label: "Produto",       icon: ShoppingBag, color: "bg-green-100 text-green-700 border-green-200" },
  OPORTUNIDADE: { label: "Oportunidade",  icon: Handshake,   color: "bg-amber-100 text-amber-700 border-amber-200" },
  PROCURA:      { label: "Procura",       icon: Search,      color: "bg-purple-100 text-purple-700 border-purple-200" },
}

export type CategoriaKey = keyof typeof CATEGORIA_CONFIG
