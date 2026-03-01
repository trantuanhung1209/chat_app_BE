-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "pinnedBy" TEXT;

-- CreateIndex
CREATE INDEX "Message_isPinned_idx" ON "Message"("isPinned");
