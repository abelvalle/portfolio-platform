CREATE TABLE "IntegrationAccount" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "pictureUrl" TEXT,
    "profileUrl" TEXT,
    "metadata" JSONB,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationAccount_provider_externalId_key" ON "IntegrationAccount"("provider", "externalId");
CREATE INDEX "IntegrationAccount_provider_idx" ON "IntegrationAccount"("provider");
