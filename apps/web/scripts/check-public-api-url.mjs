const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!rawUrl) {
  fail("NEXT_PUBLIC_API_URL is required for production web builds.");
}

let apiUrl;
try {
  apiUrl = new URL(rawUrl);
} catch {
  fail("NEXT_PUBLIC_API_URL must be a valid absolute URL.");
}

if (!["http:", "https:"].includes(apiUrl.protocol)) {
  fail("NEXT_PUBLIC_API_URL must use http or https.");
}

if (isLocalHost(apiUrl.hostname)) {
  fail("NEXT_PUBLIC_API_URL must not point to localhost for production builds.");
}

function isLocalHost(hostname) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.startsWith("127.") ||
    normalized === "[::1]"
  );
}

function fail(message) {
  console.error(`[web env] ${message}`);
  process.exit(1);
}
