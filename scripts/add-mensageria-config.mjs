import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config()

const sql = neon(process.env.DATABASE_URL)

const existing = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'config_loja'
`
const existingNames = existing.map(r => r.column_name)
console.log("Colunas existentes:", existingNames.length)

const newCols = [
  ["whatsappAtivo",            `BOOLEAN NOT NULL DEFAULT false`],
  ["whatsappProvedor",         `TEXT NOT NULL DEFAULT 'EVOLUTION'`],
  ["evolutionUrl",             `TEXT`],
  ["evolutionApiKeyEncrypted", `TEXT`],
  ["evolutionInstance",        `TEXT`],
  ["metaWabaId",               `TEXT`],
  ["metaPhoneNumberId",        `TEXT`],
  ["metaTokenEncrypted",       `TEXT`],
  ["exxorApiKeyEncrypted",     `TEXT`],
  ["exxorNumero",              `TEXT`],
  ["emailAtivoNotif",          `BOOLEAN NOT NULL DEFAULT true`],
]

for (const [name, type] of newCols) {
  if (existingNames.includes(name)) {
    console.log("JÁ EXISTE:", name)
    continue
  }
  try {
    await sql`ALTER TABLE config_loja ADD COLUMN ${sql.unsafe(`"${name}" ${type}`)}`
    console.log("CRIADO:", name)
  } catch (e) {
    console.error("ERRO em", name, ":", e.message)
  }
}

// Criar tabelas de mensageria
try {
  await sql`
    CREATE TABLE IF NOT EXISTS notificacao_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      canal TEXT NOT NULL,
      evento TEXT NOT NULL,
      status TEXT NOT NULL,
      "memberId" TEXT REFERENCES members(id) ON DELETE SET NULL,
      destinatario TEXT,
      assunto TEXT,
      corpo TEXT,
      erro TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
  console.log("CRIADO: notificacao_logs")
} catch (e) {
  if (e.message?.includes("already exists")) console.log("JÁ EXISTE: notificacao_logs")
  else console.error("ERRO notificacao_logs:", e.message)
}

try {
  await sql`CREATE INDEX IF NOT EXISTS idx_notif_logs_canal ON notificacao_logs(canal)`
  await sql`CREATE INDEX IF NOT EXISTS idx_notif_logs_evento ON notificacao_logs(evento)`
  await sql`CREATE INDEX IF NOT EXISTS idx_notif_logs_member ON notificacao_logs("memberId")`
  await sql`CREATE INDEX IF NOT EXISTS idx_notif_logs_created ON notificacao_logs("createdAt")`
  console.log("INDICES: notificacao_logs")
} catch (e) {
  console.error("ERRO indices:", e.message)
}

try {
  await sql`
    CREATE TABLE IF NOT EXISTS notificacao_preferencias (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "memberId" TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      evento TEXT NOT NULL,
      canal TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("memberId", evento, canal)
    )
  `
  console.log("CRIADO: notificacao_preferencias")
} catch (e) {
  if (e.message?.includes("already exists")) console.log("JÁ EXISTE: notificacao_preferencias")
  else console.error("ERRO notificacao_preferencias:", e.message)
}

// Verificação final
const after = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'config_loja'
`
console.log("\nColunas config_loja após migration:", after.length)

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE 'notificacao%'
`
console.log("Tabelas mensageria:", tables.map(r => r.table_name))
