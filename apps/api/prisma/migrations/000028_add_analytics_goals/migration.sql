CREATE TABLE "AnalyticsGoal" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AnalyticsGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsGoal_key_key" ON "AnalyticsGoal"("key");
CREATE INDEX "AnalyticsGoal_visible_order_idx" ON "AnalyticsGoal"("visible", "order");
CREATE INDEX "AnalyticsGoal_eventType_idx" ON "AnalyticsGoal"("eventType");
