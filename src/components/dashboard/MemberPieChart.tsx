"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

type Props = {
  ativos: number
  negativos: number
  inativos: number
  total: number
}

const SLICES = [
  { key: "regulares", label: "Regulares", color: "#22c55e" },
  { key: "negativos", label: "Negativos", color: "#ef4444" },
  { key: "inativos", label: "Inativos", color: "#94a3b8" },
]

export function MemberPieChart({ ativos, negativos, inativos, total }: Props) {
  const data = [
    { name: "Regulares", value: ativos - negativos },
    { name: "Negativos", value: negativos },
    { name: "Inativos", value: inativos },
  ].filter((d) => d.value > 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={false}
            labelLine={false}
          >
            {data.map((entry, i) => {
              const slice = SLICES.find((s) => s.name === entry.name)
              return <Cell key={i} fill={slice?.color ?? "#94a3b8"} />
            })}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v} membros`]} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
        <div className="text-center">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-xs text-muted-foreground">total</div>
        </div>
      </div>
    </div>
  )
}
