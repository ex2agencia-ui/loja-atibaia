CREATE TYPE "CategoriaClassificado" AS ENUM ('SERVICO', 'PRODUTO', 'OPORTUNIDADE', 'PROCURA');

CREATE TABLE "classificados" (
  "id"         TEXT NOT NULL,
  "memberId"   TEXT NOT NULL,
  "titulo"     TEXT NOT NULL,
  "descricao"  TEXT NOT NULL,
  "categoria"  "CategoriaClassificado" NOT NULL,
  "contato"    TEXT,
  "ativo"      BOOLEAN NOT NULL DEFAULT true,
  "expiresAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "classificados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "classificados_memberId_idx" ON "classificados"("memberId");
CREATE INDEX "classificados_categoria_idx" ON "classificados"("categoria");
CREATE INDEX "classificados_ativo_idx" ON "classificados"("ativo");

ALTER TABLE "classificados" ADD CONSTRAINT "classificados_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
