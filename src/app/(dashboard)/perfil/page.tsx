import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PerfilForm } from "./perfil-form"

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const user = session.user as { memberId?: string | null }
  const memberId = user?.memberId ?? null
  const { tab } = await searchParams

  return <PerfilForm memberId={memberId} defaultTab={tab} />
}
