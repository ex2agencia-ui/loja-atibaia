import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function toDate(s: string): Date | null {
  if (!s) return null
  const v = s.trim()
  if (!v) return null
  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + "T12:00:00.000Z")
    return isNaN(d.getTime()) ? null : d
  }
  // BR com traço ou barra: DD-MM-YYYY ou DD/MM/YYYY
  const m = v.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
const SITUACOES = ["ATIVO", "INATIVO"]
const POSICOES = ["MI", "CM", "MM", "AM"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { members } = await req.json()
  if (!Array.isArray(members)) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  let created = 0, updated = 0
  const errors: string[] = []

  for (const row of members) {
    const cim = row.cim?.trim()
    const nome = row.nome?.trim()
    if (!cim || !nome) { errors.push(`Linha ignorada — cim/nome ausente: ${cim ?? "?"}`); continue }

    const data = {
      situacao: SITUACOES.includes(row.situacao) ? row.situacao : "ATIVO",
      nome,
      posicao: POSICOES.includes(row.posicao) ? row.posicao : "AM",
      dataNascimento: toDate(row.dataNascimento),
      dataIniciacao: toDate(row.dataIniciacao),
      dataElevacao: toDate(row.dataElevacao),
      dataExaltacao: toDate(row.dataExaltacao),
      dataInstalacao: toDate(row.dataInstalacao),
      dataRegulFiliacao: toDate(row.dataRegulFiliacao),
      telefone: row.telefone || null,
      isWhatsapp: row.isWhatsapp === "true" || row.isWhatsapp === "1",
      email: row.email || null,
      rua: row.rua || null,
      numero: row.numero || null,
      complemento: row.complemento || null,
      bairro: row.bairro || null,
      cep: row.cep || null,
      cidade: row.cidade || null,
      ocupacao: row.ocupacao || null,
      notasOcupacao: row.notasOcupacao || null,
      conjuge: row.conjuge || null,
      nascimentoConjuge: toDate(row.nascimentoConjuge),
      dataCasamento: row.dataCasamento || null,
    }

    try {
      const existing = await prisma.member.findUnique({ where: { cim } })
      if (existing) {
        await prisma.member.update({ where: { cim }, data })
        updated++
      } else {
        await prisma.member.create({ data: { ...data, cim } })
        created++
      }
    } catch (e) {
      errors.push(`CIM ${cim}: ${String(e).slice(0, 80)}`)
    }
  }

  return NextResponse.json({ created, updated, errors })
}
