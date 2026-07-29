import { neon } from "@neondatabase/serverless"

const DATABASE_URL = "postgresql://neondb_owner:npg_Vr6w3IZSeQiL@ep-polished-meadow-acnu3xij.sa-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

async function typeExists(name) {
  const rows = await sql`SELECT 1 FROM pg_type WHERE typname = ${name} AND typtype = 'e'`
  return rows.length > 0
}

async function tableExists(name) {
  const rows = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = ${name} AND table_schema = 'public'`
  return rows.length > 0
}

async function run() {
  console.log("1. Creating enums...")
  if (!await typeExists("TransacaoStatus")) {
    await sql`CREATE TYPE "TransacaoStatus" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO')`
    console.log("   Created TransacaoStatus")
  } else console.log("   TransacaoStatus already exists")

  if (!await typeExists("TransacaoTipo")) {
    await sql`CREATE TYPE "TransacaoTipo" AS ENUM ('RECEITA', 'DESPESA')`
    console.log("   Created TransacaoTipo")
  } else console.log("   TransacaoTipo already exists")

  if (!await typeExists("CategoriaFinanceira")) {
    await sql`CREATE TYPE "CategoriaFinanceira" AS ENUM ('MENSALIDADE', 'TRONCO_SOLIDARIEDADE', 'TAXA_GRAU', 'DOACAO', 'MANUTENCAO_TEMPLO', 'AGAPE', 'REPASSE_POTENCIA', 'OUTROS')`
    console.log("   Created CategoriaFinanceira")
  } else console.log("   CategoriaFinanceira already exists")

  if (!await typeExists("GatewayTipo")) {
    await sql`CREATE TYPE "GatewayTipo" AS ENUM ('MANUAL', 'C6BANK', 'CORA', 'ASAAS', 'STRIPE', 'MERCADO_PAGO')`
    console.log("   Created GatewayTipo")
  } else console.log("   GatewayTipo already exists")

  console.log("\n2. Altering UserRole enum (adding FINANCEIRO if missing)...")
  const hasFinanceiro = await sql`SELECT 1 FROM pg_enum pe JOIN pg_type pt ON pe.enumtypid = pt.oid WHERE pt.typname = 'UserRole' AND pe.enumlabel = 'FINANCEIRO'`
  if (hasFinanceiro.length === 0) {
    await sql`ALTER TYPE "UserRole" ADD VALUE 'FINANCEIRO'`
    console.log("   Added FINANCEIRO to UserRole")
  } else console.log("   FINANCEIRO already in UserRole")

  console.log("\n3. Dropping FKs (to recreate)...")
  const fksToDrop = [
    `ALTER TABLE "comentarios" DROP CONSTRAINT IF EXISTS "comentarios_memberId_fkey"`,
    `ALTER TABLE "comentarios" DROP CONSTRAINT IF EXISTS "comentarios_postId_fkey"`,
    `ALTER TABLE "comunicado_destinatarios" DROP CONSTRAINT IF EXISTS "comunicado_destinatarios_comunicadoId_fkey"`,
    `ALTER TABLE "comunicado_destinatarios" DROP CONSTRAINT IF EXISTS "comunicado_destinatarios_memberId_fkey"`,
    `ALTER TABLE "comunicados" DROP CONSTRAINT IF EXISTS "comunicados_autorId_fkey"`,
    `ALTER TABLE "comunicados" DROP CONSTRAINT IF EXISTS "comunicados_postId_fkey"`,
    `ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_memberId_fkey"`,
    `ALTER TABLE "reacoes" DROP CONSTRAINT IF EXISTS "reacoes_comentarioId_fkey"`,
    `ALTER TABLE "reacoes" DROP CONSTRAINT IF EXISTS "reacoes_memberId_fkey"`,
    `ALTER TABLE "reacoes" DROP CONSTRAINT IF EXISTS "reacoes_postId_fkey"`,
  ]
  for (const stmt of fksToDrop) await sql.unsafe(stmt)
  console.log("   OK")

  console.log("\n4. Creating tables...")
  if (!await tableExists("mensalidades")) {
    await sql.unsafe(`
      CREATE TABLE "mensalidades" (
        "id" TEXT NOT NULL,
        "memberId" TEXT NOT NULL,
        "competencia" TEXT NOT NULL,
        "valor" DECIMAL(10,2) NOT NULL,
        "desconto" DECIMAL(10,2),
        "jurosMulta" DECIMAL(10,2),
        "valorTotal" DECIMAL(10,2) NOT NULL,
        "vencimento" TIMESTAMP(3) NOT NULL,
        "pagamento" TIMESTAMP(3),
        "status" "TransacaoStatus" NOT NULL DEFAULT 'PENDENTE',
        "isento" BOOLEAN NOT NULL DEFAULT false,
        "observacao" TEXT,
        "gateway" "GatewayTipo" NOT NULL DEFAULT 'MANUAL',
        "externalId" TEXT,
        "pixQrCode" TEXT,
        "pixCopiaECola" TEXT,
        "boletoUrl" TEXT,
        "emailAvisoEm" TIMESTAMP(3),
        "emailVencidoEm" TIMESTAMP(3),
        "registradoPorId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "mensalidades_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log("   Created mensalidades")
  } else console.log("   mensalidades already exists")

  if (!await tableExists("transacoes_caixa")) {
    await sql.unsafe(`
      CREATE TABLE "transacoes_caixa" (
        "id" TEXT NOT NULL,
        "tipo" "TransacaoTipo" NOT NULL,
        "categoria" "CategoriaFinanceira" NOT NULL,
        "descricao" TEXT NOT NULL,
        "valor" DECIMAL(10,2) NOT NULL,
        "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "memberId" TEXT,
        "registradoPorId" TEXT NOT NULL,
        "comprovanteUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "transacoes_caixa_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log("   Created transacoes_caixa")
  } else console.log("   transacoes_caixa already exists")

  if (!await tableExists("config_loja")) {
    await sql.unsafe(`
      CREATE TABLE "config_loja" (
        "id" TEXT NOT NULL DEFAULT 'singleton',
        "nome" TEXT NOT NULL DEFAULT 'Loja Maçônica',
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
        "cnpj" TEXT,
        "email" TEXT,
        "telefone" TEXT,
        "endereco" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "config_loja_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log("   Created config_loja")
  } else console.log("   config_loja already exists")

  console.log("\n5. Creating indexes...")
  const indexes = [
    `CREATE INDEX IF NOT EXISTS "mensalidades_memberId_idx" ON "mensalidades"("memberId")`,
    `CREATE INDEX IF NOT EXISTS "mensalidades_competencia_idx" ON "mensalidades"("competencia")`,
    `CREATE INDEX IF NOT EXISTS "mensalidades_status_idx" ON "mensalidades"("status")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "mensalidades_memberId_competencia_key" ON "mensalidades"("memberId", "competencia")`,
    `CREATE INDEX IF NOT EXISTS "transacoes_caixa_tipo_idx" ON "transacoes_caixa"("tipo")`,
    `CREATE INDEX IF NOT EXISTS "transacoes_caixa_categoria_idx" ON "transacoes_caixa"("categoria")`,
    `CREATE INDEX IF NOT EXISTS "transacoes_caixa_data_idx" ON "transacoes_caixa"("data")`,
  ]
  for (const stmt of indexes) await sql.unsafe(stmt)
  console.log("   OK")

  console.log("\n6. Re-adding foreign keys...")
  const fks = [
    `ALTER TABLE "posts" ADD CONSTRAINT "posts_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    `ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "comunicado_destinatarios" ADD CONSTRAINT "comunicado_destinatarios_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "comunicados"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "comunicado_destinatarios" ADD CONSTRAINT "comunicado_destinatarios_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "mensalidades" ADD CONSTRAINT "mensalidades_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "transacoes_caixa" ADD CONSTRAINT "transacoes_caixa_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  ]
  for (const stmt of fks) {
    try { await sql.unsafe(stmt) } catch(e) { console.log("   skip (already exists):", e.message.substring(0, 80)) }
  }
  console.log("   OK")

  console.log("\nMigration completed successfully!")
}

run().catch(err => {
  console.error("\nMigration failed:", err.message)
  process.exit(1)
})
