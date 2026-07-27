-- CreateEnum
ALTER TYPE "UserRole" ADD VALUE 'SECRETARIO';
ALTER TYPE "UserRole" ADD VALUE 'FINANCEIRO';
ALTER TYPE "UserRole" ADD VALUE 'CHANCELARIA';
ALTER TYPE "UserRole" ADD VALUE 'MEMBRO';

-- AlterTable: add new columns to users
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "memberId" TEXT;

-- Change default role from ADMIN to MEMBRO
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBRO'::"UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "users_memberId_key" ON "users"("memberId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove VIEWER from enum (safe only if no rows use it)
-- Note: PostgreSQL does not support removing enum values directly; we skip this for now.
-- VIEWER is simply unused going forward.
