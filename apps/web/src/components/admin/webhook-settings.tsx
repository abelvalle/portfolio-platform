"use client";

import { useEffect, useState } from "react";
import { RefreshCw, RotateCcw, Save, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient, type ContactWebhookDelivery, type ContactWebhookSettings, type ContactWebhookStatus } from "@/lib/api";

const emptySettingsDraft = {
  enabled: false,
  url: "",
  event: "contact.message.created",
  testEvent: "contact.webhook.test",
  timeoutMs: 5000,
  retryAttempts: 2,
  retryDelayMs: 30000
};

export function WebhookSettings() {
  const [status, setStatus] = useState<ContactWebhookStatus | null>(null);
  const [settings, setSettings] = useState<ContactWebhookSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState(emptySettingsDraft);
  const [deliveries, setDeliveries] = useState<ContactWebhookDelivery[]>([]);
  const [message, setMessage] = useState("Cargando estado de webhook.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessingRetries, setIsProcessingRetries] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const [nextStatus, nextSettings, nextDeliveries] = await Promise.all([
        adminClient.contactWebhookStatus(),
        adminClient.contactWebhookSettings(),
        adminClient.contactWebhookDeliveries()
      ]);
      setStatus(nextStatus);
      setSettings(nextSettings);
      setSettingsDraft({
        enabled: nextSettings.enabled,
        url: nextSettings.url || "",
        event: nextSettings.event,
        testEvent: nextSettings.testEvent,
        timeoutMs: nextSettings.timeoutMs,
        retryAttempts: nextSettings.retryAttempts,
        retryDelayMs: nextSettings.retryDelayMs
      });
      setDeliveries(nextDeliveries);
      setMessage(nextStatus.configured ? "Webhook configurado." : "Webhook no configurado.");
    } catch {
      setMessage("No se pudo leer el estado del webhook.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSavingSettings(true);
    try {
      const nextSettings = await adminClient.updateContactWebhookSettings({
        ...settingsDraft,
        url: settingsDraft.url.trim() || null
      });
      setSettings(nextSettings);
      setStatus({
        configured: nextSettings.enabled && Boolean(nextSettings.url),
        hasSecret: nextSettings.hasSecret,
        event: nextSettings.event,
        testEvent: nextSettings.testEvent,
        timeoutMs: nextSettings.timeoutMs,
        retryAttempts: nextSettings.retryAttempts,
        retryDelayMs: nextSettings.retryDelayMs
      });
      setMessage("Configuracion de webhook guardada sin modificar secretos.");
    } catch {
      setMessage("No se pudo guardar la configuracion de webhook.");
    } finally {
      setIsSavingSettings(false);
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

  async function processPendingRetries() {
    setIsProcessingRetries(true);
    try {
      const result = await adminClient.processContactWebhookRetries();
      await loadSettings();
      setMessage(`Reintentos pendientes procesados: ${result.processed}.`);
    } catch {
      setMessage("No se pudieron procesar los reintentos pendientes.");
    } finally {
      setIsProcessingRetries(false);
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
          URL y politica de entrega persistentes. El secreto HMAC sigue viviendo en variables de entorno y no se muestra.
        </p>
        <div className="grid gap-3 rounded-lg border border-border/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Configuracion editable</p>
              <p className="text-xs text-muted-foreground">Origen actual: {settings?.source || "environment"}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settingsDraft.enabled}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Activo
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="contactWebhookUrl">URL webhook</Label>
              <Input
                id="contactWebhookUrl"
                value={settingsDraft.url}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactWebhookEvent">Evento</Label>
              <Input id="contactWebhookEvent" value={settingsDraft.event} onChange={(event) => setSettingsDraft((current) => ({ ...current, event: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactWebhookTestEvent">Evento test</Label>
              <Input id="contactWebhookTestEvent" value={settingsDraft.testEvent} onChange={(event) => setSettingsDraft((current) => ({ ...current, testEvent: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactWebhookTimeout">Timeout ms</Label>
              <Input id="contactWebhookTimeout" type="number" min={1000} max={30000} value={settingsDraft.timeoutMs} onChange={(event) => setSettingsDraft((current) => ({ ...current, timeoutMs: Number(event.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactWebhookRetryAttempts">Reintentos</Label>
              <Input id="contactWebhookRetryAttempts" type="number" min={0} max={5} value={settingsDraft.retryAttempts} onChange={(event) => setSettingsDraft((current) => ({ ...current, retryAttempts: Number(event.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactWebhookRetryDelay">Delay retry ms</Label>
              <Input id="contactWebhookRetryDelay" type="number" min={1000} max={300000} value={settingsDraft.retryDelayMs} onChange={(event) => setSettingsDraft((current) => ({ ...current, retryDelayMs: Number(event.target.value) }))} />
            </div>
          </div>
          <div>
            <Button type="button" onClick={saveSettings} disabled={isSavingSettings}>
              <Save data-icon="inline-start" />
              {isSavingSettings ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
          <Button type="button" onClick={testWebhook} disabled={!status?.configured || isTesting}>
            <Send data-icon="inline-start" />
            {isTesting ? "Probando..." : "Probar webhook"}
          </Button>
          <Button type="button" variant="outline" onClick={processPendingRetries} disabled={!status?.configured || isProcessingRetries}>
            <RotateCcw data-icon="inline-start" />
            {isProcessingRetries ? "Procesando..." : "Procesar pendientes"}
          </Button>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span>Evento: {status?.event || "contact.message.created"}</span>
          <span>Test: {status?.testEvent || "contact.webhook.test"}</span>
          <span>Firma HMAC: {status?.hasSecret ? "activa" : "no configurada"}</span>
          <span>Timeout: {status?.timeoutMs ?? 5000} ms</span>
          <span>Reintentos: {status?.retryAttempts ?? 0} cada {status?.retryDelayMs ?? 0} ms</span>
          <span>Worker: {status?.retryWorkerEnabled === false ? "inactivo" : "activo"} cada {status?.retryWorkerIntervalMs ?? 60000} ms</span>
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
                      {delivery.retryAttempt ? ` - retry ${delivery.retryAttempt}` : ""}
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
