import * as dotenv from "dotenv"
dotenv.config()

import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { PrismaClient } from "./src/generated/prisma"

const OLD_URL =
  "postgresql://neondb_owner:npg_O6JUITS7XDKN@ep-soft-snow-ac9s405i.sa-east-1.aws.neon.tech/neondb?sslmode=require"

const NEW_URL = process.env.DATABASE_URL!

function createClient(url: string) {
  const adapter = new PrismaNeonHttp(url, {})
  return new PrismaClient({ adapter })
}

async function main() {
  const oldDb = createClient(OLD_URL)
  const newDb = createClient(NEW_URL)

  console.log("Conectando aos bancos...")

  // 1. Users
  const users = await oldDb.user.findMany()
  console.log(`Migrando ${users.length} users...`)
  for (const u of users) {
    await newDb.user.upsert({ where: { id: u.id }, create: u, update: u })
  }

  // 2. Members
  const members = await oldDb.member.findMany()
  console.log(`Migrando ${members.length} members...`)
  for (const m of members) {
    await newDb.member.upsert({ where: { id: m.id }, create: m, update: m })
  }

  // 3. Filhos
  const filhos = await oldDb.filho.findMany()
  console.log(`Migrando ${filhos.length} filhos...`)
  for (const f of filhos) {
    await newDb.filho.upsert({ where: { id: f.id }, create: f, update: f })
  }

  // 4. LojaSession
  const sessions = await oldDb.lojaSession.findMany()
  console.log(`Migrando ${sessions.length} sessões...`)
  for (const s of sessions) {
    await newDb.lojaSession.upsert({ where: { id: s.id }, create: s, update: s })
  }

  // 5. Presencas
  const presencas = await oldDb.presenca.findMany()
  console.log(`Migrando ${presencas.length} presenças...`)
  for (const p of presencas) {
    await newDb.presenca.upsert({ where: { id: p.id }, create: p, update: p })
  }

  await oldDb.$disconnect()
  await newDb.$disconnect()

  console.log("Migração concluída!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
