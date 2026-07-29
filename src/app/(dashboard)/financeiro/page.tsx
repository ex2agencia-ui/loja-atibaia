import { auth } from "@/lib/auth"
import { FinanceiroClient } from "./financeiro-client"

export default async function FinanceiroPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role ?? ""
  return <FinanceiroClient role={role} />
}
