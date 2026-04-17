export function formatarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return tel
}

export function formatarData(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

export function parseDataBR(str: string | null | undefined): Date | null {
  if (!str) return null
  const parts = str.split("/")
  if (parts.length === 3) {
    const [day, month, year] = parts
    const d = new Date(`${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}T00:00:00.000Z`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}
