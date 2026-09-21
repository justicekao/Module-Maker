-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "draftGraph" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}';
