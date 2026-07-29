"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, BookOpen, BarChart3, FileText } from "lucide-react"
import { ViewCompetencia } from "./components/view-competencia"
import { ViewMembro } from "./components/view-membro"
import { ViewVisaoGeral } from "./components/view-visao-geral"
import { ViewCaixa } from "./components/view-caixa"
import { ViewDashboard } from "./components/view-dashboard"
import { ViewRelatorio } from "./components/view-relatorio"


export function FinanceiroClient({ role }: { role: string }) {
  const isAdmin = role === "ADMIN"

  const [subViewMensalidade, setSubViewMensalidade] = useState<"competencia" | "visao-geral" | "membro">("competencia")
  const [membroIdExtrato, setMembroIdExtrato] = useState<string | undefined>()

  const irParaExtrato = (id: string) => {
    setMembroIdExtrato(id)
    setSubViewMensalidade("membro")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-sm text-slate-500">Gestão financeira da Loja</p>
        </div>
      </div>

      <Tabs defaultValue="mensalidades">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="mensalidades" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Mensalidades
          </TabsTrigger>
          <TabsTrigger value="caixa" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Caixa
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ── Mensalidades ── */}
        <TabsContent value="mensalidades" className="mt-6 space-y-4">
          <div className="flex gap-2 border-b pb-3">
            {(["competencia", "visao-geral", "membro"] as const).map((v) => {
              const labels = { competencia: "Por Competência", "visao-geral": "Visão Geral", membro: "Por Membro" }
              return (
                <button
                  key={v}
                  onClick={() => {
                    if (v !== "membro") setMembroIdExtrato(undefined)
                    setSubViewMensalidade(v)
                  }}
                  className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                    subViewMensalidade === v
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {labels[v]}
                </button>
              )
            })}
          </div>

          {subViewMensalidade === "competencia" && (
            <ViewCompetencia onVerMembro={irParaExtrato} />
          )}
          {subViewMensalidade === "visao-geral" && (
            <ViewVisaoGeral onVerExtrato={irParaExtrato} />
          )}
          {subViewMensalidade === "membro" && (
            <ViewMembro membroIdInicial={membroIdExtrato} />
          )}
        </TabsContent>

        {/* ── Caixa ── */}
        <TabsContent value="caixa" className="mt-6">
          <ViewCaixa isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <ViewDashboard />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <ViewRelatorio />
        </TabsContent>
      </Tabs>
    </div>
  )
}
