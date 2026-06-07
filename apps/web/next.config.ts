import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

function apiOrigin() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  try {
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:4000";
  }
}

function connectSrc(isDevelopment: boolean) {
  const sources = ["'self'", apiOrigin()];
  if (isDevelopment) {
    sources.push("http://localhost:4000", "https:");
  }

  return `connect-src ${Array.from(new Set(sources)).join(" ")}`;
}

function scriptSrc(isDevelopment: boolean) {
  const sources = ["'self'", "'unsafe-inline'"];
  if (isDevelopment) {
    sources.push("'unsafe-eval'");
  }

  return `script-src ${sources.join(" ")}`;
}

function contentSecurityPolicy(isDevelopment: boolean) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    connectSrc(isDevelopment),
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    scriptSrc(isDevelopment),
    "style-src 'self' 'unsafe-inline'"
  ].join("; ");
}

const nextConfig = (phase: string): NextConfig => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    transpilePackages: ["@portfolio-platform/shared"],
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Content-Security-Policy", value: contentSecurityPolicy(isDevelopment) },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
          ]
        }
      ];
    }
  }
};

export default nextConfig;
