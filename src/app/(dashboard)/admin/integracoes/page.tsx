import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { IntegracoesClient } from "./integracoes-client"

export default async function IntegracoesPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (user?.role !== "ADMIN") redirect("/")
  return <IntegracoesClient />
}
