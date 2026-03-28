-- Baseline schema (Source, Kirtan, Collection, …). Required before 20260327160000_search_document_fts.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'CRAWLER', 'API', 'IMPORT');

CREATE TYPE "KirtanTextKind" AS ENUM ('GUJARATI_LYRICS', 'TRANSLITERATION', 'ENGLISH_TRANSLATION');

CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseUrl" TEXT,
    "type" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Kirtan" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleTransliterated" TEXT,
    "summary" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "searchDocument" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kirtan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KirtanText" (
    "id" TEXT NOT NULL,
    "kirtanId" TEXT NOT NULL,
    "kind" "KirtanTextKind" NOT NULL,
    "content" TEXT NOT NULL,
    "locale" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KirtanText_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KirtanAudio" (
    "id" TEXT NOT NULL,
    "kirtanId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "durationSec" INTEGER,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KirtanAudio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KirtanCollection" (
    "kirtanId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KirtanCollection_pkey" PRIMARY KEY ("kirtanId","collectionId")
);

CREATE TABLE "KirtanRelation" (
    "id" TEXT NOT NULL,
    "fromKirtanId" TEXT NOT NULL,
    "toKirtanId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "KirtanRelation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

CREATE UNIQUE INDEX "Kirtan_slug_key" ON "Kirtan"("slug");

CREATE INDEX "Kirtan_sourceId_idx" ON "Kirtan"("sourceId");

CREATE INDEX "Kirtan_title_idx" ON "Kirtan"("title");

CREATE UNIQUE INDEX "Kirtan_sourceId_externalId_key" ON "Kirtan"("sourceId", "externalId");

CREATE INDEX "KirtanText_kirtanId_kind_idx" ON "KirtanText"("kirtanId", "kind");

CREATE INDEX "KirtanAudio_kirtanId_idx" ON "KirtanAudio"("kirtanId");

CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

CREATE INDEX "KirtanCollection_collectionId_sortOrder_idx" ON "KirtanCollection"("collectionId", "sortOrder");

CREATE INDEX "KirtanRelation_fromKirtanId_idx" ON "KirtanRelation"("fromKirtanId");

CREATE INDEX "KirtanRelation_toKirtanId_idx" ON "KirtanRelation"("toKirtanId");

CREATE UNIQUE INDEX "KirtanRelation_fromKirtanId_toKirtanId_relationType_key" ON "KirtanRelation"("fromKirtanId", "toKirtanId", "relationType");

ALTER TABLE "Kirtan" ADD CONSTRAINT "Kirtan_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KirtanText" ADD CONSTRAINT "KirtanText_kirtanId_fkey" FOREIGN KEY ("kirtanId") REFERENCES "Kirtan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KirtanAudio" ADD CONSTRAINT "KirtanAudio_kirtanId_fkey" FOREIGN KEY ("kirtanId") REFERENCES "Kirtan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KirtanCollection" ADD CONSTRAINT "KirtanCollection_kirtanId_fkey" FOREIGN KEY ("kirtanId") REFERENCES "Kirtan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KirtanCollection" ADD CONSTRAINT "KirtanCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KirtanRelation" ADD CONSTRAINT "KirtanRelation_fromKirtanId_fkey" FOREIGN KEY ("fromKirtanId") REFERENCES "Kirtan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KirtanRelation" ADD CONSTRAINT "KirtanRelation_toKirtanId_fkey" FOREIGN KEY ("toKirtanId") REFERENCES "Kirtan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
