-- CreateEnum
CREATE TYPE "StatusEnumType" AS ENUM ('pending', 'active', 'banned');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "StatusEnumType" DEFAULT 'pending';
