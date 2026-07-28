CREATE TYPE "PostTipo" AS ENUM ('FEED', 'CLASSIFICADO');

CREATE TABLE "posts" (
  "id"         TEXT NOT NULL,
  "memberId"   TEXT NOT NULL,
  "tipo"       "PostTipo" NOT NULL DEFAULT 'FEED',
  "texto"      TEXT NOT NULL,
  "imagens"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "titulo"     TEXT,
  "categoria"  "CategoriaClassificado",
  "contato"    TEXT,
  "expiresAt"  TIMESTAMP(3),
  "ativo"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comentarios" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "memberId"  TEXT NOT NULL,
  "texto"     TEXT NOT NULL,
  "imagens"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reacoes" (
  "id"           TEXT NOT NULL,
  "emoji"        TEXT NOT NULL,
  "memberId"     TEXT NOT NULL,
  "postId"       TEXT,
  "comentarioId" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reacoes_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "posts"      ADD CONSTRAINT "posts_memberId_fkey"       FOREIGN KEY ("memberId")     REFERENCES "members"("id")     ON DELETE CASCADE;
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_postId_fkey"   FOREIGN KEY ("postId")       REFERENCES "posts"("id")       ON DELETE CASCADE;
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_memberId_fkey" FOREIGN KEY ("memberId")     REFERENCES "members"("id")     ON DELETE CASCADE;
ALTER TABLE "reacoes"    ADD CONSTRAINT "reacoes_memberId_fkey"      FOREIGN KEY ("memberId")     REFERENCES "members"("id")     ON DELETE CASCADE;
ALTER TABLE "reacoes"    ADD CONSTRAINT "reacoes_postId_fkey"        FOREIGN KEY ("postId")       REFERENCES "posts"("id")       ON DELETE CASCADE;
ALTER TABLE "reacoes"    ADD CONSTRAINT "reacoes_comentarioId_fkey"  FOREIGN KEY ("comentarioId") REFERENCES "comentarios"("id") ON DELETE CASCADE;

-- Unique constraints
ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_memberId_postId_emoji_key"       UNIQUE ("memberId", "postId", "emoji");
ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_memberId_comentarioId_emoji_key" UNIQUE ("memberId", "comentarioId", "emoji");

-- Indexes
CREATE INDEX "posts_memberId_idx"   ON "posts"("memberId");
CREATE INDEX "posts_tipo_idx"       ON "posts"("tipo");
CREATE INDEX "posts_ativo_idx"      ON "posts"("ativo");
CREATE INDEX "posts_createdAt_idx"  ON "posts"("createdAt");
CREATE INDEX "comentarios_postId_idx"   ON "comentarios"("postId");
CREATE INDEX "comentarios_memberId_idx" ON "comentarios"("memberId");
CREATE INDEX "reacoes_postId_idx"       ON "reacoes"("postId");
CREATE INDEX "reacoes_comentarioId_idx" ON "reacoes"("comentarioId");
