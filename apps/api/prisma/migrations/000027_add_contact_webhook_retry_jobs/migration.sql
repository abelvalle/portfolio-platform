CREATE TABLE "ContactWebhookRetryJob" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactWebhookRetryJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactWebhookRetryJob_status_runAt_idx" ON "ContactWebhookRetryJob"("status", "runAt");
