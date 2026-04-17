export type PresencaResult = "POSITIVO" | "NEGATIVO"

export function calcularSituacaoPresenca(totalSessoes: number, faltas: number): {
  faltas: number
  totalSessoes: number
  ratio: number
  status: PresencaResult
} {
  const ratio = totalSessoes === 0 ? 0 : faltas / totalSessoes
  return {
    faltas,
    totalSessoes,
    ratio,
    status: ratio > 0.5 ? "NEGATIVO" : "POSITIVO",
  }
}

export function formatarPorcentagem(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}
