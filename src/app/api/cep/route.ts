import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const cep = new URL(req.url).searchParams.get("cep")?.replace(/\D/g, "")
  if (!cep || cep.length !== 8) return NextResponse.json({ error: "CEP inválido" }, { status: 400 })

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  const data = await res.json()
  if (data.erro) return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 })

  return NextResponse.json({
    rua: data.logradouro,
    bairro: data.bairro,
    cidade: `${data.localidade}-${data.uf}`,
    cep: data.cep,
  })
}
