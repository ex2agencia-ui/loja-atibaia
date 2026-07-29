import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_Vr6w3IZSeQiL@ep-polished-meadow-acnu3xij.sa-east-1.aws.neon.tech/neondb?sslmode=require")

async function run() {
  // Check existing tables
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  const names = tables.map(r => r.table_name)
  console.log("Existing tables:", names.join(", "))

  if (!names.includes("mensalidades")) {
    await sql`
      CREATE TABLE mensalidades (
        id TEXT NOT NULL,
        "memberId" TEXT NOT NULL,
        competencia TEXT NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        desconto DECIMAL(10,2),
        "jurosMulta" DECIMAL(10,2),
        "valorTotal" DECIMAL(10,2) NOT NULL,
        vencimento TIMESTAMP(3) NOT NULL,
        pagamento TIMESTAMP(3),
        status "TransacaoStatus" NOT NULL DEFAULT 'PENDENTE',
        isento BOOLEAN NOT NULL DEFAULT false,
        observacao TEXT,
        gateway "GatewayTipo" NOT NULL DEFAULT 'MANUAL',
        "externalId" TEXT,
        "pixQrCode" TEXT,
        "pixCopiaECola" TEXT,
        "boletoUrl" TEXT,
        "emailAvisoEm" TIMESTAMP(3),
        "emailVencidoEm" TIMESTAMP(3),
        "registradoPorId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT mensalidades_pkey PRIMARY KEY (id)
      )
    `
    console.log("Created mensalidades")
  }

  if (!names.includes("transacoes_caixa")) {
    await sql`
      CREATE TABLE transacoes_caixa (
        id TEXT NOT NULL,
        tipo "TransacaoTipo" NOT NULL,
        categoria "CategoriaFinanceira" NOT NULL,
        descricao TEXT NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        data TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "memberId" TEXT,
        "registradoPorId" TEXT NOT NULL,
        "comprovanteUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT transacoes_caixa_pkey PRIMARY KEY (id)
      )
    `
    console.log("Created transacoes_caixa")
  }

  if (!names.includes("config_loja")) {
    await sql`
      CREATE TABLE config_loja (
        id TEXT NOT NULL DEFAULT 'singleton',
        nome TEXT NOT NULL DEFAULT 'Loja Maçônica',
        "mensalidadeValorPadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "mensalidadeDiaVencimento" INTEGER NOT NULL DEFAULT 10,
        "pixChave" TEXT,
        "pixTipo" TEXT,
        "pixBeneficiario" TEXT,
        "smtpHost" TEXT,
        "smtpPort" INTEGER DEFAULT 587,
        "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
        "smtpUser" TEXT,
        "smtpPassEncrypted" TEXT,
        "emailRemetente" TEXT,
        "emailNomeRemetente" TEXT,
        cnpj TEXT,
        email TEXT,
        telefone TEXT,
        endereco TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT config_loja_pkey PRIMARY KEY (id)
      )
    `
    console.log("Created config_loja")
  }

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS mensalidades_memberId_idx ON mensalidades("memberId")`
  await sql`CREATE INDEX IF NOT EXISTS mensalidades_competencia_idx ON mensalidades(competencia)`
  await sql`CREATE INDEX IF NOT EXISTS mensalidades_status_idx ON mensalidades(status)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS mensalidades_memberId_competencia_key ON mensalidades("memberId", competencia)`
  await sql`CREATE INDEX IF NOT EXISTS transacoes_caixa_tipo_idx ON transacoes_caixa(tipo)`
  await sql`CREATE INDEX IF NOT EXISTS transacoes_caixa_categoria_idx ON transacoes_caixa(categoria)`
  await sql`CREATE INDEX IF NOT EXISTS transacoes_caixa_data_idx ON transacoes_caixa(data)`
  console.log("Indexes OK")

  // Foreign keys (ignore if already exist)
  const fks = [
    `ALTER TABLE mensalidades ADD CONSTRAINT mensalidades_memberId_fkey FOREIGN KEY ("memberId") REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE transacoes_caixa ADD CONSTRAINT transacoes_caixa_memberId_fkey FOREIGN KEY ("memberId") REFERENCES members(id) ON DELETE SET NULL ON UPDATE CASCADE`,
  ]
  for (const fk of fks) {
    try { await sql.unsafe(fk) } catch { /* already exists */ }
  }
  console.log("Foreign keys OK")

  // Seed singleton
  await sql`INSERT INTO config_loja (id, nome, "updatedAt") VALUES ('singleton', 'Loja Maçônica Itapetinga', NOW()) ON CONFLICT (id) DO NOTHING`
  console.log("Seed OK")

  // Verify
  const final = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  console.log("\nFinal tables:", final.map(r => r.table_name).join(", "))
}

run().catch(e => { console.error("FAILED:", e.message); process.exit(1) })
