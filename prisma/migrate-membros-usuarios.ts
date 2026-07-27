/**
 * Script: migrar membros com email cadastrado para usuários do sistema.
 *
 * Execução:
 *   npx tsx prisma/migrate-membros-usuarios.ts
 *
 * Comportamento:
 * - Para cada Member com email cadastrado:
 *   1. Se já existe User com esse email → vincula memberId se ainda não vinculado
 *   2. Se não existe → cria User com role=MEMBRO, senha=bcrypt(CIM), mustChangePassword=true
 * - Usuário admin existente mantém role ADMIN sem memberId
 */

import { PrismaClient } from "../src/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const members = await prisma.member.findMany({
    where: { situacao: "ATIVO", email: { not: null } },
    select: { id: true, nome: true, email: true, cim: true },
  })

  console.log(`\nProcessando ${members.length} membros com email cadastrado...\n`)

  let criados = 0
  let vinculados = 0
  let erros = 0

  for (const member of members) {
    if (!member.email) continue

    try {
      const email = member.email.trim().toLowerCase()
      const existing = await prisma.user.findUnique({ where: { email } })

      if (existing) {
        if (!existing.memberId) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { memberId: member.id },
          })
          console.log(`  [VINCULADO] ${member.nome} → ${email}`)
          vinculados++
        } else {
          console.log(`  [IGNORADO]  ${member.nome} → já tem usuário vinculado`)
        }
      } else {
        const hashed = await bcrypt.hash(member.cim, 12)
        await prisma.user.create({
          data: {
            name: member.nome,
            email,
            password: hashed,
            role: "MEMBRO",
            mustChangePassword: true,
            memberId: member.id,
          },
        })
        console.log(`  [CRIADO]    ${member.nome} → ${email} (senha: CIM ${member.cim})`)
        criados++
      }
    } catch (err) {
      console.error(`  [ERRO]      ${member.nome}: ${err}`)
      erros++
    }
  }

  console.log(`\nResumo:`)
  console.log(`  Criados:   ${criados}`)
  console.log(`  Vinculados: ${vinculados}`)
  console.log(`  Erros:     ${erros}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
