"use client"

import { useState } from "react"

const EMOJIS = ["👍", "❤️", "🙏", "😮", "😂"]

type Reacao = { id: string; emoji: string; memberId: string }

type Props = {
  reacoes: Reacao[]
  meuMemberId?: string | null
  onToggle: (emoji: string) => Promise<void>
  compact?: boolean
}

export function ReacoesBar({ reacoes, meuMemberId, onToggle, compact }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  // Agrupa: { emoji -> count }
  const counts = reacoes.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
    return acc
  }, {})

  const minhasReacoes = new Set(
    reacoes.filter(r => r.memberId === meuMemberId).map(r => r.emoji)
  )

  async function handle(emoji: string) {
    if (loading) return
    setLoading(emoji)
    try { await onToggle(emoji) } finally { setLoading(null) }
  }

  // Emojis que já têm reação aparecem primeiro, o resto em painel
  const [showAll, setShowAll] = useState(false)
  const active = EMOJIS.filter(e => counts[e])
  const inactive = EMOJIS.filter(e => !counts[e])

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Reações existentes */}
      {active.map(emoji => (
        <button
          key={emoji}
          onClick={() => handle(emoji)}
          disabled={!!loading}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors
            ${minhasReacoes.has(emoji)
              ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
              : "bg-muted border-border text-muted-foreground hover:border-indigo-300"}`}
        >
          <span>{emoji}</span>
          <span>{counts[emoji]}</span>
        </button>
      ))}

      {/* Botão para adicionar nova reação */}
      {meuMemberId && (
        <div className="relative">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            + 😊
          </button>
          {showAll && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-popover border rounded-lg shadow-lg p-1.5 z-10">
              {inactive.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { handle(emoji); setShowAll(false) }}
                  disabled={!!loading}
                  className="text-lg hover:scale-125 transition-transform px-0.5"
                >
                  {emoji}
                </button>
              ))}
              {inactive.length === 0 && (
                <span className="text-xs text-muted-foreground px-1">Todos os emojis usados</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
