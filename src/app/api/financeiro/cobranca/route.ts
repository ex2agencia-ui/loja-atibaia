import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ROLES_FINANCEIRO } from "@/lib/permissions"
import { decrypt } from "@/lib/crypto"
import nodemailer from "nodemailer"

// POST /api/financeiro/cobranca
// canal: "email" | "comunicado"
// mensalidadeId ou texto livre de itens
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = session.user as { id?: string; role?: string }
  if (!ROLES_FINANCEIRO.includes(user.role as never)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body = await req.json()
  const { canal, memberId, mensalidadeIds } = body as {
    canal: "email" | "comunicado"
    memberId: string
    mensalidadeIds: string[]
  }

  if (!canal || !memberId || !mensalidadeIds?.length) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  // Busca dados do membro
  const membro = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, nome: true, email: true },
  })
  if (!membro) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })

  // Busca as mensalidades selecionadas
  const mensalidades = await prisma.mensalidade.findMany({
    where: { id: { in: mensalidadeIds }, memberId },
    select: { id: true, competencia: true, valorTotal: true, vencimento: true, status: true },
  })

  if (!mensalidades.length) {
    return NextResponse.json({ error: "Nenhuma mensalidade encontrada" }, { status: 404 })
  }

  const config = await prisma.configLoja.findUnique({ where: { id: "singleton" } })

  // Monta texto da cobrança
  const itensTexto = mensalidades.map(m => {
    const [ano, mes] = m.competencia.split("-")
    const comp = new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    const valor = Number(m.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    return `• ${comp}: ${valor}`
  }).join("\n")

  const totalAberto = mensalidades.reduce((acc, m) => acc + Number(m.valorTotal), 0)
  const totalStr = totalAberto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const pixInfo = config?.pixChave
    ? `\n\nChave PIX (${config.pixTipo ?? ""}): ${config.pixChave}${config.pixBeneficiario ? `\nBeneficiário: ${config.pixBeneficiario}` : ""}`
    : ""

  const mensagem = `Ir. ${membro.nome},\n\nIdentificamos as seguintes mensalidades em aberto:\n\n${itensTexto}\n\nTotal: ${totalStr}${pixInfo}\n\nApós o pagamento, favor enviar o comprovante à tesouraria para darmos baixa.\n\nGrato pela atenção.\n${config?.nome ?? "Loja"}`

  if (canal === "email") {
    if (!membro.email) {
      return NextResponse.json({ error: "Membro sem email cadastrado" }, { status: 422 })
    }
    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPassEncrypted) {
      return NextResponse.json({ error: "SMTP não configurado. Configure em Admin > Configurações." }, { status: 422 })
    }

    let smtpPass: string
    try {
      smtpPass = decrypt(config.smtpPassEncrypted)
    } catch {
      return NextResponse.json({ error: "Erro ao descriptografar senha SMTP" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort ?? 587,
      secure: config.smtpSecure ?? false,
      auth: { user: config.smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: config.emailRemetente
        ? `"${config.emailNomeRemetente ?? config.nome ?? "Loja"}" <${config.emailRemetente}>`
        : config.smtpUser,
      to: membro.email,
      subject: `Cobrança de mensalidades — ${config.nome ?? "Loja"}`,
      text: mensagem,
    })

    return NextResponse.json({ ok: true, canal: "email", destinatario: membro.email })
  }

  if (canal === "comunicado") {
    // Cria comunicado apenas para este membro
    const autorId = (user as { id?: string }).id
    if (!autorId) return NextResponse.json({ error: "Usuário inválido" }, { status: 401 })

    const comunicado = await prisma.comunicado.create({
      data: {
        autorId,
        titulo: `Mensalidades em aberto — ${membro.nome}`,
        texto: mensagem,
        imagens: [],
        noFeed: false,
      },
    })

    await prisma.comunicadoDestinatario.create({
      data: { comunicadoId: comunicado.id, memberId: membro.id },
    })

    return NextResponse.json({ ok: true, canal: "comunicado", comunicadoId: comunicado.id })
  }

  return NextResponse.json({ error: "Canal inválido" }, { status: 400 })
}
