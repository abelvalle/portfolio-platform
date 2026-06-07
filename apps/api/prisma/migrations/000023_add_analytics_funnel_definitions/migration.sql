CREATE TABLE "AnalyticsFunnelDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AnalyticsFunnelDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsFunnelDefinition_key_key" ON "AnalyticsFunnelDefinition"("key");
CREATE INDEX "AnalyticsFunnelDefinition_visible_order_idx" ON "AnalyticsFunnelDefinition"("visible", "order");
