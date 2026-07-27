import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NavigationLoader } from "@/components/layout/navigation-loader"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any
  if (user?.mustChangePassword) redirect("/trocar-senha")

  return (
    <div className="flex flex-col h-full">
      <NavigationLoader />
      <Header user={{ name: session.user?.name, email: session.user?.email }} vercelUrl={process.env.VERCEL_URL} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  )
}
