-- Snapshot retention: keep only the newest N snapshots per drawing.
-- This composite index matches the prune ordering (version DESC, createdAt DESC)
-- so retention only has to scan the surplus rows instead of the full history.
-- CreateIndex
CREATE INDEX IF NOT EXISTS "DrawingSnapshot_drawingId_version_createdAt_idx" ON "DrawingSnapshot"("drawingId", "version" DESC, "createdAt" DESC);
