import type { NextConfig } from "next";

function apiOrigin() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  try {
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:4000";
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `connect-src 'self' ${apiOrigin()} http://localhost:4000 https:`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'"
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@portfolio-platform/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
