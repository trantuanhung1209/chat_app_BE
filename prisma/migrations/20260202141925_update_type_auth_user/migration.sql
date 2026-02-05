-- CreateEnum
CREATE TYPE "authProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "type" "authProvider" NOT NULL DEFAULT 'EMAIL';
