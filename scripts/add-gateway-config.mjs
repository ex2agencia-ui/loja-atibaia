import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
dotenv.config()

const sql = neon(process.env.DATABASE_URL)

async function addCol(stmt) {
  try {
    const rows = await sql.unsafe(stmt)
    console.log("OK:", stmt.match(/"([^"]+)"/g)?.[0])
    return rows
  } catch (e) {
    if (e.message?.includes("already exists")) {
      console.log("JÁ EXISTE:", stmt.match(/"([^"]+)"/g)?.[0])
    } else {
      console.error("ERRO:", e.message, "\n  stmt:", stmt.substring(0, 80))
    }
  }
}

// Verificar se já existem
const existing = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'config_loja'
`
const existingNames = existing.map(r => r.column_name)
console.log("Colunas existentes:", existingNames.length)

const newCols = [
  ["gatewayAtivo",              `TEXT NOT NULL DEFAULT 'MANUAL'`],
  ["gatewaySandbox",            `BOOLEAN NOT NULL DEFAULT true`],
  ["asaasApiKeyEncrypted",      `TEXT`],
  ["mercadoPagoTokenEncrypted", `TEXT`],
  ["stripeSecretKeyEncrypted",  `TEXT`],
  ["stripeWebhookSecret",       `TEXT`],
  ["coraClientId",              `TEXT`],
  ["coraClientSecretEncrypted", `TEXT`],
  ["c6ClientId",                `TEXT`],
  ["c6CertificateEncrypted",    `TEXT`],
  ["c6CertificatePass",         `TEXT`],
]

for (const [name, type] of newCols) {
  if (existingNames.includes(name)) {
    console.log("JÁ EXISTE:", name)
    continue
  }
  // Usa template literal do neon para cada ALTER
  try {
    await sql`ALTER TABLE config_loja ADD COLUMN ${sql.unsafe(`"${name}" ${type}`)}`
    console.log("CRIADO:", name)
  } catch (e) {
    console.error("ERRO em", name, ":", e.message)
  }
}

// Verificação final
const after = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'config_loja'
`
console.log("\nColunas após migration:", after.length)
after.forEach(r => console.log(" -", r.column_name))
