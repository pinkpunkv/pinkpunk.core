-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "createdAt" SET DEFAULT (now() at time zone 'utc')::text;
