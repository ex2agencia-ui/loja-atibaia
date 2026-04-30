-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberSituacao" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Posicao" AS ENUM ('MI', 'CM', 'MM', 'AM');

-- CreateEnum
CREATE TYPE "SessionTipo" AS ENUM ('ORDINARIA', 'MAGNA', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "PresencaStatus" AS ENUM ('NV', 'K', 'AB', 'SU', 'F', 'FM', 'FR', 'BAN', 'REP', 'IN', 'IND', 'IP', 'EL', 'EX', 'MI', 'MM', 'CM', 'AM', 'P', 'REG', 'SM', 'ZERO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "cim" TEXT NOT NULL,
    "situacao" "MemberSituacao" NOT NULL DEFAULT 'ATIVO',
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "posicao" "Posicao" NOT NULL,
    "dataIniciacao" TIMESTAMP(3),
    "dataElevacao" TIMESTAMP(3),
    "dataExaltacao" TIMESTAMP(3),
    "dataInstalacao" TIMESTAMP(3),
    "dataRegulFiliacao" TIMESTAMP(3),
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "telefone" TEXT,
    "isWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "ocupacao" TEXT,
    "notasOcupacao" TEXT,
    "conjuge" TEXT,
    "nascimentoConjuge" TIMESTAMP(3),
    "dataCasamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filhos" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),

    CONSTRAINT "filhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loja_sessions" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "tipo" "SessionTipo" NOT NULL DEFAULT 'ORDINARIA',
    "fotoUrl" TEXT,
    "fotoKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loja_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "PresencaStatus" NOT NULL DEFAULT 'F',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_cim_key" ON "members"("cim");

-- CreateIndex
CREATE INDEX "members_situacao_idx" ON "members"("situacao");

-- CreateIndex
CREATE INDEX "members_posicao_idx" ON "members"("posicao");

-- CreateIndex
CREATE INDEX "loja_sessions_data_idx" ON "loja_sessions"("data");

-- CreateIndex
CREATE INDEX "presencas_memberId_idx" ON "presencas"("memberId");

-- CreateIndex
CREATE INDEX "presencas_sessionId_idx" ON "presencas"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_memberId_sessionId_key" ON "presencas"("memberId", "sessionId");

-- AddForeignKey
ALTER TABLE "filhos" ADD CONSTRAINT "filhos_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "loja_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
