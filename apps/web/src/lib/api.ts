import { portfolioFallback, type PortfolioSnapshot } from "./portfolio-data";
import { getLocalizedFallback, localizeSnapshot, type Locale } from "./i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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
  }
};

export const adminClient = {
  dashboard() {
    return apiFetch("/admin/dashboard");
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
