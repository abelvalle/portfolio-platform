import { portfolioFallback, type PortfolioSnapshot } from "./portfolio-data";
import { getLocalizedFallback, localizeSnapshot, type Locale } from "./i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export function getApiUrl(path: string) {
  return `${API_URL}${path}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    credentials: "include",
    cache: init?.method && init.method !== "GET" ? "no-store" : "no-store"
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    body,
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const portfolioClient = {
  async snapshot(locale: Locale = "es"): Promise<PortfolioSnapshot> {
    try {
      const [profile, theme, experiences, education, certifications, skills, projects, cv] = await Promise.all([
        apiFetch("/profile"),
        apiFetch("/theme"),
        apiFetch("/experiences"),
        apiFetch("/education"),
        apiFetch("/certifications"),
        apiFetch("/skills"),
        apiFetch("/projects"),
        apiFetch("/cv")
      ]);
      return localizeSnapshot(
        { profile, theme, experiences, education, certifications, skills, projects, cv } as PortfolioSnapshot,
        locale
      );
    } catch {
      return locale === "es" ? portfolioFallback : getLocalizedFallback(locale);
    }
  },
  sendContact(data: Record<string, string>) {
    return apiFetch("/contact-messages", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  track(type: string, label?: string, path?: string) {
    return apiFetch("/analytics/events", {
      method: "POST",
      body: JSON.stringify({ type, label, path })
    }).catch(() => undefined);
  }
};

export const authClient = {
  login(email: string, password: string) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  verifyMfaLogin(mfaToken: string, code: string) {
    return apiFetch("/auth/mfa/verify-login", {
      method: "POST",
      body: JSON.stringify({ mfaToken, code })
    });
  },
  me() {
    return apiFetch("/auth/me");
  },
  logout() {
    return apiFetch("/auth/logout", { method: "POST" });
  },
  mfaStatus() {
    return apiFetch<MfaStatus>("/auth/mfa/status");
  },
  setupMfa() {
    return apiFetch<MfaSetup>("/auth/mfa/setup", { method: "POST" });
  },
  confirmMfa(code: string) {
    return apiFetch<MfaConfirm>("/auth/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) });
  },
  disableMfa(code: string) {
    return apiFetch<MfaStatus>("/auth/mfa/disable", { method: "POST", body: JSON.stringify({ code }) });
  }
};

export const adminClient = {
  dashboard() {
    return apiFetch("/admin/dashboard");
  },
  publicationThemeReview() {
    return apiFetch<PublicationThemeReview>("/admin/publication/theme/review");
  },
  publishThemeDraft() {
    return apiFetch<{ changedFields: string[] }>("/admin/publication/theme/publish", { method: "POST" });
  },
  restorePublicationChange(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/changelog/${id}/restore`, { method: "POST" });
  },
  changeLog() {
    return apiFetch<ChangeLogItem[]>("/admin/publication/changelog");
  },
  users() {
    return apiFetch<AdminUser[]>("/users");
  },
  userPermissions() {
    return apiFetch<Record<AdminUserRole, string[]>>("/users/permissions");
  },
  createUser(data: { email: string; name?: string; role: AdminUserRole; password: string }) {
    return apiFetch<AdminUser>("/users", { method: "POST", body: JSON.stringify(data) });
  },
  updateUser(id: string, data: { name?: string; role?: AdminUserRole; password?: string }) {
    return apiFetch<AdminUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteUser(id: string) {
    return apiFetch<AdminUser>(`/users/${id}`, { method: "DELETE" });
  },
  contactWebhookStatus() {
    return apiFetch<ContactWebhookStatus>("/contact-messages/webhook/status");
  },
  testContactWebhook() {
    return apiFetch<ContactWebhookTestResult>("/contact-messages/webhook/test", { method: "POST" });
  },
  contactMessages(status?: string) {
    return apiFetch<ContactMessage[]>(`/contact-messages${status ? `?status=${encodeURIComponent(status)}` : ""}`);
  },
  updateContactMessageStatus(id: string, status: string) {
    return apiFetch<ContactMessage>(`/contact-messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  deleteContactMessage(id: string) {
    return apiFetch<ContactMessage>(`/contact-messages/${id}`, { method: "DELETE" });
  },
  updateTheme(data: unknown) {
    return apiFetch("/theme", { method: "PATCH", body: JSON.stringify(data) });
  },
  list(resource: string) {
    return apiFetch(`/${resource}?includeHidden=true`);
  },
  update(resource: string, id: string, data: unknown) {
    return apiFetch(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }
};

export const cvClient = {
  versions() {
    return apiFetch("/cv-versions");
  },
  templates() {
    return apiFetch("/cv-templates");
  },
  adapt(data: { baseCvVersionId: string; targetRole: string; targetCompany?: string; jobDescription: string }) {
    return apiFetch("/cv/adapt-to-role", { method: "POST", body: JSON.stringify(data) });
  },
  compare(baseCvVersionId: string, adaptedCvVersionId: string) {
    return apiFetch("/cv/compare-versions", {
      method: "POST",
      body: JSON.stringify({ baseCvVersionId, adaptedCvVersionId })
    });
  }
};

export type PublicationThemeReview = {
  entityType: "theme";
  entityId: string | null;
  hasDraft: boolean;
  publishedAt: string | null;
  fields: Array<{
    field: string;
    before: string;
    after: string;
    changed: boolean;
  }>;
  latestChanges: ChangeLogItem[];
};

export type ChangeLogItem = {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  summary: string;
  createdAt: string;
};

export type AdminUserRole = "admin" | "editor" | "viewer";

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role: AdminUserRole;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MfaStatus = {
  enabled: boolean;
  confirmedAt?: string | null;
  lastUsedAt?: string | null;
  recoveryCodesRemaining?: number;
};

export type MfaSetup = {
  secret: string;
  otpauthUrl: string;
};

export type MfaConfirm = {
  enabled: boolean;
  recoveryCodes: string[];
};

export type ContactWebhookStatus = {
  configured: boolean;
  hasSecret: boolean;
  event: string;
  testEvent: string;
  timeoutMs: number;
};

export type ContactWebhookTestResult = {
  configured: boolean;
  dispatched: boolean;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export type MediaAsset = {
  id: string;
  filename: string;
  originalName?: string | null;
  mimeType: string;
  size?: number | null;
  url: string;
  type?: string | null;
  updatedAt?: string;
};

export type MediaStorageStatus = {
  provider: string;
  storageDir: string;
  maxFileSizeMb: number;
  allowedMimeTypes: string[];
  uploadEndpoint: string;
  downloadPattern: string;
};

export const mediaClient = {
  list() {
    return apiFetch<MediaAsset[]>("/media");
  },
  storageStatus() {
    return apiFetch<MediaStorageStatus>("/media/storage/status");
  },
  upload(data: FormData) {
    return apiUpload<MediaAsset>("/media/upload", data);
  }
};
