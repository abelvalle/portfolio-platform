import { portfolioFallback, type PortfolioSnapshot } from "./portfolio-data";
import {
  applyPublicDictionary,
  getLocalizedFallback,
  localizeSnapshot,
  publicCopy as fallbackPublicCopy,
  type Locale,
  type PublicCopy,
  type PublicTranslationDictionary
} from "./i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export function getApiUrl(path: string) {
  return `${API_URL}${path}`;
}

export function getPublicCvDownloadUrl(templateSlug?: string) {
  return getApiUrl(withQuery("/cv/download", { template: templateSlug }));
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
  async publicCopy(locale: Locale = "es"): Promise<PublicCopy> {
    try {
      const dictionary = await apiFetch<PublicTranslationDictionary>(withQuery("/translations/public/dictionary", { locale }));
      return applyPublicDictionary(fallbackPublicCopy[locale], dictionary);
    } catch {
      return fallbackPublicCopy[locale];
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
      body: JSON.stringify({ type, label, path, ...trackingAttribution(path) })
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
  publicationExperienceReview(id: string) {
    return apiFetch<PublicationExperienceReview>(`/admin/publication/experiences/${id}/review`);
  },
  publicationProjectReview(id: string) {
    return apiFetch<PublicationProjectReview>(`/admin/publication/projects/${id}/review`);
  },
  publicationSkillReview(id: string) {
    return apiFetch<PublicationSkillReview>(`/admin/publication/skills/${id}/review`);
  },
  publicationEducationReview(id: string) {
    return apiFetch<PublicationEducationReview>(`/admin/publication/education/${id}/review`);
  },
  publicationCertificationReview(id: string) {
    return apiFetch<PublicationCertificationReview>(`/admin/publication/certifications/${id}/review`);
  },
  publicationCvVersionReview(id: string) {
    return apiFetch<PublicationCvVersionReview>(`/admin/publication/cv-versions/${id}/review`);
  },
  publishThemeDraft() {
    return apiFetch<{ changedFields: string[] }>("/admin/publication/theme/publish", { method: "POST" });
  },
  publishProfileDraft() {
    return apiFetch<{ changedFields: string[] }>("/admin/publication/profile/publish", { method: "POST" });
  },
  publishExperienceDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/experiences/${id}/publish`, { method: "POST" });
  },
  publishProjectDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/projects/${id}/publish`, { method: "POST" });
  },
  publishSkillDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/skills/${id}/publish`, { method: "POST" });
  },
  publishEducationDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/education/${id}/publish`, { method: "POST" });
  },
  publishCertificationDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/certifications/${id}/publish`, { method: "POST" });
  },
  publishCvVersionDraft(id: string) {
    return apiFetch<{ changedFields: string[] }>(`/admin/publication/cv-versions/${id}/publish`, { method: "POST" });
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
  contactEmailStatus() {
    return apiFetch<ContactEmailStatus>("/contact-messages/email/status");
  },
  testContactEmail() {
    return apiFetch<ContactEmailTestResult>("/contact-messages/email/test", { method: "POST" });
  },
  contactWebhookSettings() {
    return apiFetch<ContactWebhookSettings>("/contact-messages/webhook/settings");
  },
  updateContactWebhookSettings(data: Partial<ContactWebhookSettingsMutation>) {
    return apiFetch<ContactWebhookSettings>("/contact-messages/webhook/settings", {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },
  validateContactWebhookSecret(secret: string) {
    return apiFetch<ContactWebhookSecretValidation>("/contact-messages/webhook/secret/validate", {
      method: "POST",
      body: JSON.stringify({ secret })
    });
  },
  linkedinStatus() {
    return apiFetch<LinkedinIntegrationStatus>("/integrations/linkedin/status");
  },
  contactWebhookDeliveries() {
    return apiFetch<ContactWebhookDelivery[]>("/contact-messages/webhook/deliveries");
  },
  testContactWebhook() {
    return apiFetch<ContactWebhookTestResult>("/contact-messages/webhook/test", { method: "POST" });
  },
  retryContactWebhook(messageId: string) {
    return apiFetch<ContactWebhookRetryResult>(`/contact-messages/webhook/messages/${encodeURIComponent(messageId)}/retry`, { method: "POST" });
  },
  processContactWebhookRetries() {
    return apiFetch<ContactWebhookRetryProcessResult>("/contact-messages/webhook/retries/process", { method: "POST" });
  },
  contactMessages(filters?: ContactMessageFilters) {
    return apiFetch<ContactMessage[]>(withQuery("/contact-messages", filters));
  },
  contactMessagesExportUrl(filters?: ContactMessageFilters) {
    return getApiUrl(withQuery("/contact-messages/export", filters));
  },
  updateContactMessageStatus(id: string, status: string) {
    return apiFetch<ContactMessage>(`/contact-messages/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  bulkUpdateContactMessageStatus(data: ContactMessageBulkStatusMutation) {
    return apiFetch<ContactMessageBulkStatusResult>("/contact-messages/status/bulk", { method: "PATCH", body: JSON.stringify(data) });
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
  projectCategories() {
    return apiFetch<ProjectCategoryItem[]>("/project-categories?includeHidden=true");
  },
  createProjectCategory(data: ProjectCategoryMutation) {
    return apiFetch<ProjectCategoryItem>("/project-categories", { method: "POST", body: JSON.stringify(data) });
  },
  updateProjectCategory(id: string, data: Partial<ProjectCategoryMutation>) {
    return apiFetch<ProjectCategoryItem>(`/project-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) });
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
  skillCategories() {
    return apiFetch<SkillCategoryItem[]>("/skill-categories?includeHidden=true");
  },
  createSkillCategory(data: SkillCategoryMutation) {
    return apiFetch<SkillCategoryItem>("/skill-categories", { method: "POST", body: JSON.stringify(data) });
  },
  updateSkillCategory(id: string, data: Partial<SkillCategoryMutation>) {
    return apiFetch<SkillCategoryItem>(`/skill-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) });
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
  analyticsExportUrl(filters?: AnalyticsEventFilters) {
    return getApiUrl(withQuery("/analytics/export", filters));
  },
  analyticsTimeSeries(filters?: AnalyticsEventFilters) {
    return apiFetch<AnalyticsTimeSeriesPoint[]>(withQuery("/analytics/timeseries", filters));
  },
  analyticsChannels(filters?: AnalyticsEventFilters) {
    return apiFetch<AnalyticsChannels>(withQuery("/analytics/channels", filters));
  },
  analyticsLabels(filters?: AnalyticsEventFilters) {
    return apiFetch<AnalyticsLabels>(withQuery("/analytics/labels", filters));
  },
  analyticsFunnel(filters?: AnalyticsFunnelFilters) {
    return apiFetch<AnalyticsFunnel>(withQuery("/analytics/funnel", filters));
  },
  analyticsFunnelDefinitions(includeHidden = true) {
    return apiFetch<AnalyticsFunnelDefinition[]>(
      withQuery("/analytics/funnel-definitions", { includeHidden: includeHidden ? "true" : undefined })
    );
  },
  createAnalyticsFunnelDefinition(data: AnalyticsFunnelDefinitionMutation) {
    return apiFetch<AnalyticsFunnelDefinition>("/analytics/funnel-definitions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  updateAnalyticsFunnelDefinition(id: string, data: Partial<AnalyticsFunnelDefinitionMutation>) {
    return apiFetch<AnalyticsFunnelDefinition>(`/analytics/funnel-definitions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },
  deleteAnalyticsFunnelDefinition(id: string) {
    return apiFetch<AnalyticsFunnelDefinition>(`/analytics/funnel-definitions/${id}`, { method: "DELETE" });
  },
  analyticsGoalsProgress(filters?: DateRangeFilters) {
    return apiFetch<AnalyticsGoalProgress[]>(withQuery("/analytics/goals/progress", filters));
  },
  analyticsGoals(includeHidden = true) {
    return apiFetch<AnalyticsGoal[]>(withQuery("/analytics/goals", { includeHidden: includeHidden ? "true" : undefined }));
  },
  createAnalyticsGoal(data: AnalyticsGoalMutation) {
    return apiFetch<AnalyticsGoal>("/analytics/goals", { method: "POST", body: JSON.stringify(data) });
  },
  updateAnalyticsGoal(id: string, data: Partial<AnalyticsGoalMutation>) {
    return apiFetch<AnalyticsGoal>(`/analytics/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteAnalyticsGoal(id: string) {
    return apiFetch<AnalyticsGoal>(`/analytics/goals/${id}`, { method: "DELETE" });
  },
  analyticsChannelFunnel(filters?: DateRangeFilters) {
    return apiFetch<AnalyticsChannelFunnel>(withQuery("/analytics/funnel/channels", filters));
  },
  analyticsPrivacy() {
    return apiFetch<AnalyticsPrivacyStatus>("/analytics/privacy");
  },
  pruneAnalyticsRetention() {
    return apiFetch<AnalyticsRetentionPruneResult>("/analytics/retention/prune", { method: "POST" });
  },
  appModules() {
    return apiFetch<AppModuleItem[]>("/app-modules?includeHidden=true");
  },
  updateAppModule(id: string, data: Partial<AppModuleItem>) {
    return apiFetch<AppModuleItem>(`/app-modules/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  translations(filters?: TranslationFilters) {
    return apiFetch<TranslationEntry[]>(withQuery("/translations", filters));
  },
  upsertTranslation(data: TranslationMutation) {
    return apiFetch<TranslationEntry>("/translations", { method: "POST", body: JSON.stringify(data) });
  },
  updateTranslation(id: string, data: Partial<TranslationMutation>) {
    return apiFetch<TranslationEntry>(`/translations/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteTranslation(id: string) {
    return apiFetch<TranslationEntry>(`/translations/${id}`, { method: "DELETE" });
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
  atsReport(id: string) {
    return apiFetch<CvAtsReport>(`/cv/${id}/ats-report`);
  },
  atsRoleReport(id: string, data: { targetRole?: string; jobDescription: string }) {
    return apiFetch<CvAtsRoleReport>(`/cv/${id}/ats-role-report`, { method: "POST", body: JSON.stringify(data) });
  },
  generateAtsPdf(id: string) {
    return apiFetch<CvGeneratedFileResult>(`/cv/${id}/generate-ats-pdf`, { method: "POST" });
  },
  generateAtsDocx(id: string) {
    return apiFetch<CvGeneratedFileResult>(`/cv/${id}/generate-ats-docx`, { method: "POST" });
  },
  versions() {
    return apiFetch<CvVersionItem[]>("/cv-versions");
  },
  versionAuditLog(filters?: CvVersionAuditFilters) {
    return apiFetch<AuditLogItem[]>(withQuery("/cv-versions/audit-log", filters));
  },
  versionAuditExportUrl(filters?: CvVersionAuditFilters) {
    return getApiUrl(withQuery("/cv-versions/audit-log/export", filters));
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
  targetRoles() {
    return apiFetch<CvTargetRoleItem[]>("/cv-target-roles");
  },
  createTargetRole(data: CvTargetRoleMutation) {
    return apiFetch<CvTargetRoleItem>("/cv-target-roles", { method: "POST", body: JSON.stringify(data) });
  },
  updateTargetRole(id: string, data: Partial<CvTargetRoleMutation>) {
    return apiFetch<CvTargetRoleItem>(`/cv-target-roles/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteTargetRole(id: string) {
    return apiFetch<CvTargetRoleItem>(`/cv-target-roles/${id}`, { method: "DELETE" });
  },
  adapt(data: { baseCvVersionId: string; targetRole: string; targetRoleId?: string; targetCompany?: string; jobDescription: string }) {
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
    before: unknown;
    after: unknown;
    changed: boolean;
  }>;
  latestChanges: ChangeLogItem[];
};

export type PublicationProfileReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "profile";
};

export type PublicationExperienceReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "experience";
};

export type PublicationProjectReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "project";
};

export type PublicationSkillReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "skill";
};

export type PublicationEducationReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "education";
};

export type PublicationCertificationReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "certification";
};

export type PublicationCvVersionReview = Omit<PublicationThemeReview, "entityType"> & {
  entityType: "cv-version";
};

export type ChangeLogItem = {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  summary: string;
  createdAt: string;
};

export type AuditLogItem = {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CvVersionAuditFilters = {
  action?: string;
  resourceId?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
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
  segments?: {
    analytics: {
      landingVisits: number;
      cvDownloads: number;
      contactSubmits: number;
      projectViews: number;
    };
    content: {
      publishedProjects: number;
      visibleExperiences: number;
      activeModules: number;
      totalModules: number;
    };
    cohorts?: Array<{ period: string; count: number }>;
    cohortSources?: Array<{ period: string; source: string; channel: string; count: number }>;
    cohortComparisons?: Array<{
      period: string;
      count: number;
      previousPeriod: string;
      previousCount: number;
      delta: number;
      deltaPercent: number;
    }>;
    cohortSourceComparisons?: Array<{
      period: string;
      source: string;
      channel: string;
      count: number;
      previousPeriod: string;
      previousCount: number;
      delta: number;
      deltaPercent: number;
    }>;
    kpiGoals?: {
      total: number;
      achieved: number;
      atRisk: number;
      items: Array<{
        id: string;
        key: string;
        name: string;
        eventType: string;
        eventTypes: string[];
        targetCount: number;
        count: number;
        progressRate: number;
        achieved: boolean;
        remainingCount: number;
        alertLevel: "success" | "info" | "warning";
      }>;
    };
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
  retryAttempts?: number;
  retryDelayMs?: number;
  retryWorkerEnabled?: boolean;
  retryWorkerIntervalMs?: number;
};

export type ContactEmailStatus = {
  enabled: boolean;
  configured: boolean;
  provider: string;
  apiUrlConfigured: boolean;
  apiKeyConfigured: boolean;
  fromConfigured: boolean;
  toConfigured: boolean;
  timeoutMs: number;
};

export type ContactEmailTestResult = {
  configured: boolean;
  dispatched: boolean;
  provider: string;
  status?: number | null;
  error?: string | null;
};

export type ContactWebhookSettings = ContactWebhookStatus & {
  id?: string;
  enabled: boolean;
  url?: string | null;
  retryAttempts: number;
  retryDelayMs: number;
  source: "database" | "environment";
};

export type ContactWebhookSettingsMutation = {
  enabled: boolean;
  url?: string | null;
  event: string;
  testEvent: string;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
};

export type ContactWebhookSecretValidation = {
  configured: boolean;
  valid: boolean;
  signatureHeader: string;
  algorithm: string;
};

export type LinkedinIntegrationStatus = {
  configured: boolean;
  profileUrl?: string | null;
  scopes: string[];
  shareEnabled: boolean;
  connected?: boolean;
  lastSyncedAt?: string | null;
};

export type ContactWebhookTestResult = {
  configured: boolean;
  dispatched: boolean;
};

export type ContactWebhookRetryResult = {
  messageId: string;
  dispatched: boolean;
  status?: number | null;
};

export type ContactWebhookRetryProcessResult = {
  processed: number;
  results: ContactWebhookRetryResult[];
};

export type ContactWebhookDelivery = {
  id: string;
  event: string;
  configured: boolean;
  dispatched: boolean;
  status?: number | null;
  error?: string | null;
  messageId?: string | null;
  retryAttempt?: number | null;
  createdAt: string;
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

export type ContactMessageBulkStatusMutation = DateRangeFilters & {
  currentStatus?: string;
  targetStatus: string;
};

export type ContactMessageBulkStatusResult = {
  count: number;
  status: string;
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
  draftJson?: Partial<ExperienceMutation> | null;
  publishedAt?: string | null;
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
  draftJson?: Partial<ProjectMutation> | null;
  publishedAt?: string | null;
};

export type ProjectMutation = Omit<ProjectItem, "id">;

export type ProjectCategoryItem = {
  id: string;
  name: string;
  order: number;
  visible: boolean;
};

export type ProjectCategoryMutation = Omit<ProjectCategoryItem, "id">;

export type SkillItem = {
  id: string;
  name: string;
  categoryName?: string | null;
  level?: string | null;
  order: number;
  visible: boolean;
  draftJson?: Partial<SkillMutation> | null;
  publishedAt?: string | null;
};

export type SkillMutation = Omit<SkillItem, "id">;

export type SkillCategoryItem = {
  id: string;
  name: string;
  order: number;
  visible: boolean;
};

export type SkillCategoryMutation = Omit<SkillCategoryItem, "id">;

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
  draftJson?: Partial<EducationMutation> | null;
  publishedAt?: string | null;
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
  draftJson?: Partial<CertificationMutation> | null;
  publishedAt?: string | null;
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

export type AnalyticsFunnelFilters = DateRangeFilters & {
  steps?: string;
};

export type AnalyticsEvent = {
  id: string;
  type: string;
  path?: string | null;
  label?: string | null;
  createdAt: string;
};

export type AnalyticsTimeSeriesPoint = {
  date: string;
  total: number;
  types: Record<string, number>;
};

export type AnalyticsChannels = {
  sources: Array<{ name: string; count: number }>;
  channels: Array<{ name: string; count: number }>;
};

export type AnalyticsLabels = {
  labels: Array<{ name: string; count: number }>;
  paths: Array<{ name: string; count: number }>;
  contexts: Array<{ name: string; count: number }>;
};

export type AnalyticsFunnel = {
  steps: Array<{
    key: string;
    label: string;
    count: number;
    rateFromStart: number;
    rateFromPrevious: number;
  }>;
};

export type AnalyticsFunnelDefinition = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  steps: string[];
  visible: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AnalyticsFunnelDefinitionMutation = {
  key: string;
  name: string;
  description?: string | null;
  steps: string[];
  visible: boolean;
  order: number;
};

export type AnalyticsGoal = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  eventType: string;
  eventTypes?: string[];
  targetCount: number;
  period: string;
  visible: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AnalyticsGoalMutation = {
  key: string;
  name: string;
  description?: string | null;
  eventType: string;
  eventTypes?: string[];
  targetCount: number;
  period: string;
  visible: boolean;
  order: number;
};

export type AnalyticsGoalProgress = AnalyticsGoal & {
  count: number;
  progressRate: number;
  achieved: boolean;
  remainingCount: number;
  alertLevel: "success" | "info" | "warning";
  alertMessage: string;
};

export type AnalyticsChannelFunnel = {
  segments: Array<{
    source: string;
    channel: string;
    landingVisits: number;
    cvDownloads: number;
    contactSubmits: number;
    cvDownloadRate: number;
    contactRate: number;
  }>;
};

export type AnalyticsPrivacyStatus = {
  retentionDays: number | null;
  storeUserAgent: boolean;
  ipHashSaltConfigured: boolean;
  retentionWorkerEnabled?: boolean;
  retentionWorkerIntervalMs?: number;
};

export type AnalyticsRetentionPruneResult = {
  retentionDays: number | null;
  cutoff?: string;
  deleted: number;
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

export type TranslationEntry = {
  id: string;
  locale: string;
  namespace: string;
  key: string;
  value: string;
  description?: string | null;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TranslationFilters = {
  locale?: string;
  namespace?: string;
  includeHidden?: string;
};

export type TranslationMutation = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  description?: string | null;
  visible: boolean;
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
  quotaMb?: number | null;
  assetCount?: number;
  usedBytes?: number;
  usedMb?: number;
  signatureScanEnabled?: boolean;
  externalScanEnabled?: boolean;
  externalScanConfigured?: boolean;
  allowedMimeTypes: string[];
  uploadEndpoint: string;
  downloadPattern: string;
};

export type CvVersionDraftJson = {
  name?: string;
  slug?: string;
  description?: string | null;
  targetRole?: string;
  targetCompany?: string | null;
  language?: string;
  status?: "draft" | "published" | "archived";
  templateId?: string | null;
  structuredJson?: unknown;
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
  draftJson?: CvVersionDraftJson | null;
  publishedAt?: string | null;
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

export type CvAtsReport = {
  score: number;
  status: "strong" | "review" | "needs_work" | string;
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    weight: number;
    detail: string;
  }>;
  keywords: string[];
  recommendations: string[];
};

export type CvAtsRoleReport = CvAtsReport & {
  targetRole?: string;
  matchScore: number;
  jobKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  roleRecommendations: string[];
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
  draftJson?: CvVersionDraftJson | null;
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

export type CvTargetRoleItem = {
  id: string;
  name: string;
  description?: string | null;
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CvTargetRoleMutation = Pick<CvTargetRoleItem, "name" | "keywords"> & {
  description?: string | null;
};

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
    experiences?: Array<{
      role?: string;
      company?: string;
      description?: string;
      responsibilities?: string[];
      achievements?: string[];
      [key: string]: unknown;
    }>;
    adaptationMeta?: {
      keywords?: string[];
      mode?: string;
      pendingReview?: boolean;
      guardrail?: string;
    };
    [key: string]: unknown;
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
  },
  delete(id: string) {
    return apiFetch<MediaAsset>(`/media/${id}`, { method: "DELETE" });
  }
};

function trackingAttribution(path?: string) {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(path?.split("?")[1] || window.location.search);
  const source = params.get("utm_source") || params.get("source");
  const channel = params.get("utm_medium");
  if (source || channel) {
    return { source: source || "direct", channel: channel || "referral" };
  }

  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.host !== window.location.host) {
        return { source: referrer.host, channel: "referral" };
      }
    } catch {
      return {};
    }
  }

  return { source: "direct", channel: "direct" };
}
