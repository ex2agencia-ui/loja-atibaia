import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const toDate = (s: string) => (s ? new Date(s) : null)
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
      dataCasamento: toDate(row.dataCasamento),
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
