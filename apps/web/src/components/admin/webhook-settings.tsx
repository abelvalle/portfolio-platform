"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminClient, type ContactWebhookStatus } from "@/lib/api";

export function WebhookSettings() {
  const [status, setStatus] = useState<ContactWebhookStatus | null>(null);
  const [message, setMessage] = useState("Cargando estado de webhook.");
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const nextStatus = await adminClient.contactWebhookStatus();
      setStatus(nextStatus);
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
      await loadStatus();
    } catch {
      setMessage("No se pudo ejecutar la prueba de webhook.");
    } finally {
      setIsTesting(false);
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
          <Button type="button" variant="outline" onClick={loadStatus} disabled={isLoading}>
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
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </CardContent>
    </Card>
  );
}
