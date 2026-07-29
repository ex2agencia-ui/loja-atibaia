import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import MensageriaClient from "./mensageria-client"

export default async function MensageriaPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== "ADMIN") redirect("/")

  return <MensageriaClient />
}
