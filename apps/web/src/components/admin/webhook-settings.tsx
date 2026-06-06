"use client";

import { useEffect, useState } from "react";
import { RefreshCw, RotateCcw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminClient, type ContactWebhookDelivery, type ContactWebhookStatus } from "@/lib/api";

export function WebhookSettings() {
  const [status, setStatus] = useState<ContactWebhookStatus | null>(null);
  const [deliveries, setDeliveries] = useState<ContactWebhookDelivery[]>([]);
  const [message, setMessage] = useState("Cargando estado de webhook.");
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const [nextStatus, nextDeliveries] = await Promise.all([
        adminClient.contactWebhookStatus(),
        adminClient.contactWebhookDeliveries()
      ]);
      setStatus(nextStatus);
      setDeliveries(nextDeliveries);
      setMessage(nextStatus.configured ? "Webhook configurado por variables de entorno." : "Webhook no configurado.");
    } catch {
      setMessage("No se pudo leer el estado del webhook.");
    } finally {
      setIsLoading(false);
    }
  }

  async function testWebhook() {
    setIsTesting(true);
    try {
      const result = await adminClient.testContactWebhook();
      setMessage(result.dispatched ? "Evento de prueba enviado correctamente." : "Evento de prueba no enviado.");
      await loadSettings();
    } catch {
      setMessage("No se pudo ejecutar la prueba de webhook.");
    } finally {
      setIsTesting(false);
    }
  }

  async function retryWebhook(messageId: string) {
    setRetryingMessageId(messageId);
    try {
      const result = await adminClient.retryContactWebhook(messageId);
      await loadSettings();
      setMessage(result.dispatched ? `Reintento enviado para ${messageId}.` : `Reintento no enviado para ${messageId}.`);
    } catch {
      setMessage(`No se pudo reintentar el webhook para ${messageId}.`);
    } finally {
      setRetryingMessageId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Webhooks contacto</CardTitle>
          <Badge variant={status?.configured ? "default" : "outline"}>{status?.configured ? "configurado" : "sin configurar"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Estado de `CONTACT_WEBHOOK_URL` y firma opcional. Los secretos no se muestran en el panel.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
          <Button type="button" onClick={testWebhook} disabled={!status?.configured || isTesting}>
            <Send data-icon="inline-start" />
            {isTesting ? "Probando..." : "Probar webhook"}
          </Button>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span>Evento: {status?.event || "contact.message.created"}</span>
          <span>Test: {status?.testEvent || "contact.webhook.test"}</span>
          <span>Firma HMAC: {status?.hasSecret ? "activa" : "no configurada"}</span>
          <span>Timeout: {status?.timeoutMs ?? 5000} ms</span>
        </div>
        <div className="grid gap-2">
          <h3 className="text-sm font-medium">Ultimas entregas webhook</h3>
          {deliveries.length ? (
            <div className="grid gap-2">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="grid gap-2 rounded-md border border-border/60 p-3 text-sm sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{delivery.event}</p>
                    <p className="text-muted-foreground">
                      {formatDeliveryDate(delivery.createdAt)}
                      {delivery.messageId ? ` - mensaje ${delivery.messageId}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant={delivery.dispatched ? "default" : "outline"}>
                      {delivery.dispatched ? "enviado" : "fallido"}
                    </Badge>
                    <span className="text-muted-foreground">{delivery.status ? `HTTP ${delivery.status}` : delivery.error || "sin HTTP"}</span>
                    {!delivery.dispatched && delivery.messageId ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => retryWebhook(delivery.messageId as string)}
                        disabled={!status?.configured || retryingMessageId === delivery.messageId}
                      >
                        <RotateCcw data-icon="inline-start" />
                        {retryingMessageId === delivery.messageId ? "Reintentando..." : "Reintentar"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin entregas registradas.</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </CardContent>
    </Card>
  );
}

function formatDeliveryDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
