import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Loja Maçônica Itapetininga",
  description: "Sistema de Gestão da Loja Maçônica Itapetininga",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="h-full bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
        <Analytics />
        <Script id="hide-next-logo" strategy="afterInteractive">{`
          (function () {
            function tryHide() {
              var el = document.getElementById('next-logo');
              if (el) { el.style.setProperty('display', 'none', 'important'); return true; }
              var hosts = document.querySelectorAll('*');
              for (var i = 0; i < hosts.length; i++) {
                var sr = hosts[i].shadowRoot;
                if (sr) { var se = sr.getElementById('next-logo'); if (se) { se.style.setProperty('display', 'none', 'important'); return true; } }
              }
              return false;
            }
            if (!tryHide()) {
              var obs = new MutationObserver(function () { if (tryHide()) obs.disconnect(); });
              obs.observe(document.documentElement, { childList: true, subtree: true });
            }
          })();
        `}</Script>
      </body>
    </html>
  )
}
