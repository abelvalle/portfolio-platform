CREATE TABLE "TranslationEntry" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TranslationEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TranslationEntry_locale_namespace_key_key" ON "TranslationEntry"("locale", "namespace", "key");
CREATE INDEX "TranslationEntry_locale_namespace_idx" ON "TranslationEntry"("locale", "namespace");
