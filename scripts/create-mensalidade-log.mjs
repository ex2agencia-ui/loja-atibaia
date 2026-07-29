import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_Vr6w3IZSeQiL@ep-polished-meadow-acnu3xij.sa-east-1.aws.neon.tech/neondb?sslmode=require")

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS mensalidade_logs (
      id              TEXT NOT NULL,
      "mensalidadeId" TEXT NOT NULL,
      campo           TEXT NOT NULL,
      "valorAntes"    TEXT,
      "valorDepois"   TEXT,
      motivo          TEXT,
      "userId"        TEXT NOT NULL,
      "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT mensalidade_logs_pkey PRIMARY KEY (id)
    )
  `
  console.log("Table mensalidade_logs created")

  await sql`CREATE INDEX IF NOT EXISTS mensalidade_logs_mensalidadeId_idx ON mensalidade_logs("mensalidadeId")`
  await sql`CREATE INDEX IF NOT EXISTS mensalidade_logs_createdAt_idx ON mensalidade_logs("createdAt")`
  console.log("Indexes created")

  try {
    await sql`
      ALTER TABLE mensalidade_logs
        ADD CONSTRAINT mensalidade_logs_mensalidadeId_fkey
        FOREIGN KEY ("mensalidadeId") REFERENCES mensalidades(id) ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log("Foreign key added")
  } catch {
    console.log("Foreign key already exists")
  }

  console.log("Done!")
}

run().catch(e => { console.error("FAILED:", e.message); process.exit(1) })
