"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

export function MfaQrCode({ otpauthUrl }: { otpauthUrl: string }) {
  const [qrData, setQrData] = useState<{ otpauthUrl: string; dataUrl: string } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const qrDataUrl = qrData?.otpauthUrl === otpauthUrl ? qrData.dataUrl : null;
  const error = failedUrl === otpauthUrl;

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrData({ otpauthUrl, dataUrl });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailedUrl(otpauthUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <span className="font-medium">QR local</span>
      <div className="grid min-h-[220px] place-items-center rounded-lg bg-white p-3">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="QR local para configurar MFA"
            width={220}
            height={220}
            unoptimized
            className="size-[220px]"
          />
        ) : (
          <span className="text-xs text-slate-600">
            {error ? "No se pudo generar el QR." : "Generando QR..."}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Escanea este QR con tu app TOTP. Si no se lee, usa el secret manual.
      </p>
    </div>
  );
}
