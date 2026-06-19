-- CreateTable
CREATE TABLE "ExcalidrawLibraryCatalogItem" (
    "id" TEXT NOT NULL,
    "officialId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "preview" TEXT,
    "version" INTEGER,
    "authors" JSONB,
    "itemNames" JSONB,
    "createdDate" TIMESTAMP(3),
    "updatedDate" TIMESTAMP(3),
    "isCurated" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "cachedAt" TIMESTAMP(3),
    "cachePath" TEXT,
    "previewCachePath" TEXT,
    "sha256" TEXT,
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcalidrawLibraryCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcalidrawLibraryPack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "category" TEXT,
    "parentSlug" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcalidrawLibraryPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcalidrawLibraryPackItem" (
    "packId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "aliases" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcalidrawLibraryPackItem_pkey" PRIMARY KEY ("packId","libraryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcalidrawLibraryCatalogItem_officialId_key" ON "ExcalidrawLibraryCatalogItem"("officialId");

-- CreateIndex
CREATE UNIQUE INDEX "ExcalidrawLibraryCatalogItem_slug_key" ON "ExcalidrawLibraryCatalogItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExcalidrawLibraryCatalogItem_source_key" ON "ExcalidrawLibraryCatalogItem"("source");

-- CreateIndex
CREATE INDEX "ExcalidrawLibraryCatalogItem_isCurated_idx" ON "ExcalidrawLibraryCatalogItem"("isCurated");

-- CreateIndex
CREATE INDEX "ExcalidrawLibraryCatalogItem_name_idx" ON "ExcalidrawLibraryCatalogItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExcalidrawLibraryPack_slug_key" ON "ExcalidrawLibraryPack"("slug");

-- CreateIndex
CREATE INDEX "ExcalidrawLibraryPack_kind_idx" ON "ExcalidrawLibraryPack"("kind");

-- CreateIndex
CREATE INDEX "ExcalidrawLibraryPack_parentSlug_idx" ON "ExcalidrawLibraryPack"("parentSlug");

-- CreateIndex
CREATE INDEX "ExcalidrawLibraryPackItem_libraryId_idx" ON "ExcalidrawLibraryPackItem"("libraryId");

-- AddForeignKey
ALTER TABLE "ExcalidrawLibraryPackItem" ADD CONSTRAINT "ExcalidrawLibraryPackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "ExcalidrawLibraryPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcalidrawLibraryPackItem" ADD CONSTRAINT "ExcalidrawLibraryPackItem_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "ExcalidrawLibraryCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
