import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PerfilForm } from "./perfil-form"

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = session.user as any
  const memberId = user?.memberId as string | null | undefined

  return <PerfilForm memberId={memberId ?? null} />
}
