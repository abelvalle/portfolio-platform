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

function withQuery(path: string, params?: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
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
  },
  regenerateMfaRecoveryCodes(code: string) {
    return apiFetch<MfaConfirm>("/auth/mfa/recovery-codes/regenerate", { method: "POST", body: JSON.stringify({ code }) });
  }
};

export const adminClient = {
  dashboard(filters?: DateRangeFilters) {
    return apiFetch<AdminDashboard>(withQuery("/admin/dashboard", filters));
  },
  publicationThemeReview() {
    return apiFetch<PublicationThemeReview>("/admin/publication/theme/review");
  },
  publicationProfileReview() {
    return apiFetch<PublicationProfileReview>("/admin/publication/profile/review");
  },
  publishThemeDraft() {
    return apiFetch<{ changedFields: string[] }>("/admin/publication/theme/publish", { method: "POST" });
  },
  publishProfileDraft() {
    return apiFetch<{ changedFields: string[] }>("/admin/publication/profile/publish", { method: "POST" });
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
  contactMessages(filters?: ContactMessageFilters) {
    return apiFetch<ContactMessage[]>(withQuery("/contact-messages", filters));
  },
  updateContactMessageStatus(id: string, status: string) {
    return apiFetch<ContactMessage>(`/contact-messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  deleteContactMessage(id: string) {
    return apiFetch<ContactMessage>(`/contact-messages/${id}`, { method: "DELETE" });
  },
  experiences() {
    return apiFetch<ExperienceItem[]>("/experiences?includeHidden=true");
  },
  createExperience(data: ExperienceMutation) {
    return apiFetch<ExperienceItem>("/experiences", { method: "POST", body: JSON.stringify(data) });
  },
  updateExperience(id: string, data: Partial<ExperienceMutation>) {
    return apiFetch<ExperienceItem>(`/experiences/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteExperience(id: string) {
    return apiFetch<ExperienceItem>(`/experiences/${id}`, { method: "DELETE" });
  },
  projects() {
    return apiFetch<ProjectItem[]>("/projects?includeHidden=true");
  },
  createProject(data: ProjectMutation) {
    return apiFetch<ProjectItem>("/projects", { method: "POST", body: JSON.stringify(data) });
  },
  updateProject(id: string, data: Partial<ProjectMutation>) {
    return apiFetch<ProjectItem>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteProject(id: string) {
    return apiFetch<ProjectItem>(`/projects/${id}`, { method: "DELETE" });
  },
  skills() {
    return apiFetch<SkillItem[]>("/skills?includeHidden=true");
  },
  createSkill(data: SkillMutation) {
    return apiFetch<SkillItem>("/skills", { method: "POST", body: JSON.stringify(data) });
  },
  updateSkill(id: string, data: Partial<SkillMutation>) {
    return apiFetch<SkillItem>(`/skills/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteSkill(id: string) {
    return apiFetch<SkillItem>(`/skills/${id}`, { method: "DELETE" });
  },
  education() {
    return apiFetch<EducationItem[]>("/education?includeHidden=true");
  },
  createEducation(data: EducationMutation) {
    return apiFetch<EducationItem>("/education", { method: "POST", body: JSON.stringify(data) });
  },
  updateEducation(id: string, data: Partial<EducationMutation>) {
    return apiFetch<EducationItem>(`/education/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteEducation(id: string) {
    return apiFetch<EducationItem>(`/education/${id}`, { method: "DELETE" });
  },
  certifications() {
    return apiFetch<CertificationItem[]>("/certifications?includeHidden=true");
  },
  createCertification(data: CertificationMutation) {
    return apiFetch<CertificationItem>("/certifications", { method: "POST", body: JSON.stringify(data) });
  },
  updateCertification(id: string, data: Partial<CertificationMutation>) {
    return apiFetch<CertificationItem>(`/certifications/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteCertification(id: string) {
    return apiFetch<CertificationItem>(`/certifications/${id}`, { method: "DELETE" });
  },
  analyticsSummary(filters?: DateRangeFilters) {
    return apiFetch<AnalyticsSummary>(withQuery("/analytics/summary", filters));
  },
  analyticsEvents(filters?: AnalyticsEventFilters) {
    return apiFetch<AnalyticsEvent[]>(withQuery("/analytics", filters));
  },
  appModules() {
    return apiFetch<AppModuleItem[]>("/app-modules?includeHidden=true");
  },
  updateAppModule(id: string, data: Partial<AppModuleItem>) {
    return apiFetch<AppModuleItem>(`/app-modules/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  profile() {
    return apiFetch<ProfileSettings>("/profile");
  },
  updateProfile(data: unknown) {
    return apiFetch<ProfileSettings>("/profile", { method: "PATCH", body: JSON.stringify(data) });
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
  primary() {
    return apiFetch<CvItem>("/cv");
  },
  update(id: string, data: Partial<CvMutation>) {
    return apiFetch<CvItem>(`/cv/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  versions() {
    return apiFetch<CvVersionItem[]>("/cv-versions");
  },
  createVersion(data: CvVersionMutation) {
    return apiFetch<CvVersionItem>("/cv-versions", { method: "POST", body: JSON.stringify(data) });
  },
  updateVersion(id: string, data: Partial<CvVersionMutation>) {
    return apiFetch<CvVersionItem>(`/cv-versions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  generateVersionPdf(id: string) {
    return apiFetch<CvGeneratedFileResult>(`/cv-versions/${id}/generate-pdf`, { method: "POST" });
  },
  generateVersionDocx(id: string) {
    return apiFetch<CvGeneratedFileResult>(`/cv-versions/${id}/generate-docx`, { method: "POST" });
  },
  setPrimaryVersion(id: string) {
    return apiFetch<CvVersionItem>(`/cv-versions/${id}/set-primary`, { method: "POST" });
  },
  deleteVersion(id: string) {
    return apiFetch<CvVersionItem>(`/cv-versions/${id}`, { method: "DELETE" });
  },
  templates() {
    return apiFetch<CvTemplateItem[]>("/cv-templates?includeHidden=true");
  },
  createTemplate(data: CvTemplateMutation) {
    return apiFetch<CvTemplateItem>("/cv-templates", { method: "POST", body: JSON.stringify(data) });
  },
  updateTemplate(id: string, data: Partial<CvTemplateMutation>) {
    return apiFetch<CvTemplateItem>(`/cv-templates/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteTemplate(id: string) {
    return apiFetch<CvTemplateItem>(`/cv-templates/${id}`, { method: "DELETE" });
  },
  adapt(data: { baseCvVersionId: string; targetRole: string; targetCompany?: string; jobDescription: string }) {
    return apiFetch<CvAdaptationResult>("/cv/adapt-to-role", { method: "POST", body: JSON.stringify(data) });
  },
  compare(baseCvVersionId: string, adaptedCvVersionId: string) {
    return apiFetch<CvCompareResult>("/cv/compare-versions", {
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
    before: string | null;
    after: string | null;
    changed: boolean;
  }>;
  latestChanges: ChangeLogItem[];
};

export type PublicationProfileReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "profile";
};

export type ChangeLogItem = {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  summary: string;
  createdAt: string;
};

export type AdminDashboard = {
  cards: {
    totalVisits: number;
    publishedProjects: number;
    visibleExperiences: number;
    receivedMessages: number;
    primaryCv: string;
    cvUpdatedAt?: string | null;
  };
  latestChanges: ChangeLogItem[];
  modules: Array<{
    id: string;
    key: string;
    name: string;
    description?: string | null;
    enabled: boolean;
    order: number;
  }>;
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

export type ContactMessageFilters = DateRangeFilters & {
  status?: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  location?: string | null;
  modality?: string | null;
  description: string;
  achievements: string[];
  responsibilities: string[];
  technologies: string[];
  methodologies: string[];
  skills: string[];
  order: number;
  visible: boolean;
  featured: boolean;
};

export type ExperienceMutation = Omit<ExperienceItem, "id">;

export type ProjectItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published" | "archived";
  categoryName?: string | null;
  technologies: string[];
  imageUrl?: string | null;
  publicUrl?: string | null;
  repositoryUrl?: string | null;
  featured: boolean;
  visible: boolean;
  sample: boolean;
  order: number;
};

export type ProjectMutation = Omit<ProjectItem, "id">;

export type SkillItem = {
  id: string;
  name: string;
  categoryName?: string | null;
  level?: string | null;
  order: number;
  visible: boolean;
};

export type SkillMutation = Omit<SkillItem, "id">;

export type EducationItem = {
  id: string;
  title: string;
  institution: string;
  date: string;
  description?: string | null;
  type: string;
  certificateUrl?: string | null;
  attachmentId?: string | null;
  order: number;
  visible: boolean;
};

export type EducationMutation = Omit<EducationItem, "id">;

export type CertificationItem = {
  id: string;
  title: string;
  institution: string;
  date: string;
  description?: string | null;
  certificateUrl?: string | null;
  attachmentId?: string | null;
  order: number;
  visible: boolean;
};

export type CertificationMutation = Omit<CertificationItem, "id">;

export type AnalyticsSummary = {
  totalVisits: number;
  cvDownloads: number;
  contactSubmits: number;
  projectViews: number;
};

export type DateRangeFilters = {
  from?: string;
  to?: string;
};

export type AnalyticsEventFilters = DateRangeFilters & {
  type?: string;
};

export type AnalyticsEvent = {
  id: string;
  type: string;
  path?: string | null;
  label?: string | null;
  createdAt: string;
};

export type AppModuleItem = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileSettings = {
  id: string;
  fullName: string;
  headline: string;
  subtitle: string;
  shortBio: string;
  longBio: string;
  location: string;
  availability: string;
  email: string;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  cvUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  primaryLanguage: string;
  ctaPrimary: string;
  ctaSecondary: string;
  publishedAt?: string | null;
  draftJson?: Record<string, string | null> | null;
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

export type CvVersionItem = {
  id: string;
  cvId: string;
  templateId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  targetRole: string;
  targetCompany?: string | null;
  language: string;
  status: "draft" | "published" | "archived";
  structuredJson?: unknown;
  generatedPdfId?: string | null;
  generatedDocxId?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CvGeneratedFileResult = {
  media: MediaAsset;
  generated: {
    id: string;
    cvVersionId?: string | null;
    mediaAssetId?: string | null;
    type: "pdf" | "docx";
    url: string;
    createdAt: string;
  };
};

export type CvItem = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  summary: string;
  status: "draft" | "published" | "archived";
  isPrimary: boolean;
  updatedAt: string;
};

export type CvMutation = Pick<CvItem, "name" | "headline" | "summary" | "status">;

export type CvVersionMutation = Pick<CvVersionItem, "cvId" | "name" | "slug" | "targetRole" | "language" | "status"> & {
  description?: string | null;
  targetCompany?: string | null;
  templateId?: string | null;
  structuredJson?: unknown;
  isPrimary?: boolean;
};

export type CvTemplateItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  config: Record<string, unknown>;
  visible: boolean;
  order: number;
};

export type CvTemplateMutation = Omit<CvTemplateItem, "id">;

export type CvAdaptationResult = {
  request: {
    id: string;
    targetRole: string;
    targetCompany?: string | null;
    status: string;
  };
  proposed: {
    summary?: string;
    skills?: Array<{ name?: string; category?: string }>;
    experiences?: Array<{ role?: string; company?: string }>;
    adaptationMeta?: {
      keywords?: string[];
      mode?: string;
      pendingReview?: boolean;
      guardrail?: string;
    };
  };
};

export type CvCompareResult = {
  summary?: { base?: string; adapted?: string };
  skillsOrder?: { base?: string[]; adapted?: string[] };
  highlightedExperience?: { base?: string[]; adapted?: string[] };
  sectionOrder?: { base?: string[]; adapted?: string[] };
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
