"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, type MfaSetup, type MfaStatus } from "@/lib/api";
import { MfaQrCode } from "./mfa-qr-code";

export function MfaSettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("Cargando estado MFA.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const nextStatus = await authClient.mfaStatus();
      setStatus(nextStatus);
      setMessage(nextStatus.enabled ? "MFA activo en la cuenta actual." : "MFA pendiente de configurar.");
    } catch {
      setMessage("No se pudo leer MFA. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startSetup() {
    try {
      const nextSetup = await authClient.setupMfa();
      setSetup(nextSetup);
      setRecoveryCodes([]);
      setMessage("Setup iniciado. Anade el secreto a tu app TOTP y confirma el codigo.");
    } catch {
      setMessage("No se pudo iniciar MFA. Si ya esta activo, desactivalo primero.");
    }
  }

  async function confirmSetup() {
    try {
      const result = await authClient.confirmMfa(confirmCode);
      setRecoveryCodes(result.recoveryCodes);
      setSetup(null);
      setConfirmCode("");
      setMessage("MFA confirmado. Guarda los recovery codes ahora.");
      await loadStatus();
    } catch {
      setMessage("Codigo MFA no valido.");
    }
  }

  async function disableMfa() {
    try {
      await authClient.disableMfa(disableCode);
      setDisableCode("");
      setRecoveryCodes([]);
      setSetup(null);
      setMessage("MFA desactivado.");
      await loadStatus();
    } catch {
      setMessage("No se pudo desactivar MFA. Codigo/recovery code no valido.");
    }
  }

  async function regenerateRecoveryCodes() {
    try {
      const result = await authClient.regenerateMfaRecoveryCodes(disableCode);
      setRecoveryCodes(result.recoveryCodes);
      setDisableCode("");
      setMessage("Recovery codes regenerados. Guardalos ahora; solo se muestran una vez.");
      await loadStatus();
    } catch {
      setMessage("No se pudieron regenerar recovery codes. Codigo/recovery code no valido.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Seguridad admin</CardTitle>
          <Badge variant={status?.enabled ? "default" : "secondary"}>{status?.enabled ? "MFA activo" : "MFA preparado"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadStatus} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
          <Button type="button" onClick={startSetup} disabled={Boolean(status?.enabled)}>
            <ShieldCheck data-icon="inline-start" />
            Iniciar setup
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>

        {setup ? (
          <section className="grid gap-3 rounded-lg border border-border p-4">
            <h2 className="font-semibold">Setup TOTP</h2>
            <MfaQrCode otpauthUrl={setup.otpauthUrl} />
            <div className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Secret</span>
              <code className="break-all rounded bg-muted p-2 text-xs">{setup.secret}</code>
            </div>
            <div className="grid gap-2 text-sm">
              <span className="text-muted-foreground">otpauth URL</span>
              <code className="break-all rounded bg-muted p-2 text-xs">{setup.otpauthUrl}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} placeholder="Codigo TOTP" />
              <Button type="button" onClick={confirmSetup}>Confirmar MFA</Button>
            </div>
          </section>
        ) : null}

        {recoveryCodes.length ? (
          <section className="grid gap-3 rounded-lg border border-border p-4">
            <h2 className="font-semibold">Recovery codes</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map((code) => <code key={code} className="rounded bg-muted p-2 text-xs">{code}</code>)}
            </div>
          </section>
        ) : null}

        {status?.enabled ? (
          <section className="grid gap-3 rounded-lg border border-border p-4">
            <h2 className="font-semibold">MFA activo</h2>
            <div className="flex flex-wrap gap-2">
              <Input value={disableCode} onChange={(event) => setDisableCode(event.target.value)} placeholder="Codigo TOTP o recovery code" />
              <Button type="button" variant="outline" onClick={regenerateRecoveryCodes}>
                <RefreshCw data-icon="inline-start" />
                Regenerar recovery codes
              </Button>
              <Button type="button" variant="destructive" onClick={disableMfa}>
                <ShieldOff data-icon="inline-start" />
                Desactivar
              </Button>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
