CREATE TABLE "ContactWebhookSetting" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "event" TEXT NOT NULL DEFAULT 'contact.message.created',
    "testEvent" TEXT NOT NULL DEFAULT 'contact.webhook.test',
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "retryAttempts" INTEGER NOT NULL DEFAULT 2,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactWebhookSetting_pkey" PRIMARY KEY ("id")
);
