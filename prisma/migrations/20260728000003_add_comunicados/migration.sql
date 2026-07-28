CREATE TABLE "comunicados" (
  "id"        TEXT NOT NULL,
  "autorId"   TEXT NOT NULL,
  "titulo"    TEXT NOT NULL,
  "texto"     TEXT NOT NULL,
  "imagens"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "noFeed"    BOOLEAN NOT NULL DEFAULT false,
  "postId"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comunicado_destinatarios" (
  "id"           TEXT NOT NULL,
  "comunicadoId" TEXT NOT NULL,
  "memberId"     TEXT NOT NULL,
  "lidoEm"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comunicado_destinatarios_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autorId_fkey"   FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_postId_fkey"     FOREIGN KEY ("postId")  REFERENCES "posts"("id") ON DELETE SET NULL;
ALTER TABLE "comunicado_destinatarios" ADD CONSTRAINT "comunicado_destinatarios_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "comunicados"("id") ON DELETE CASCADE;
ALTER TABLE "comunicado_destinatarios" ADD CONSTRAINT "comunicado_destinatarios_memberId_fkey"     FOREIGN KEY ("memberId")     REFERENCES "members"("id")    ON DELETE CASCADE;

ALTER TABLE "comunicados"              ADD CONSTRAINT "comunicados_postId_key" UNIQUE ("postId");
ALTER TABLE "comunicado_destinatarios" ADD CONSTRAINT "comunicado_destinatarios_comunicadoId_memberId_key" UNIQUE ("comunicadoId", "memberId");

CREATE INDEX "comunicados_autorId_idx"              ON "comunicados"("autorId");
CREATE INDEX "comunicados_createdAt_idx"            ON "comunicados"("createdAt");
CREATE INDEX "comunicado_destinatarios_memberId_idx"     ON "comunicado_destinatarios"("memberId");
CREATE INDEX "comunicado_destinatarios_comunicadoId_idx" ON "comunicado_destinatarios"("comunicadoId");
