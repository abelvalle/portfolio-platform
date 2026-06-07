import { expect, test, type Page } from "@playwright/test";

async function expectA4PreviewLayout(page: Page) {
  const metrics = await page.locator("[data-cv-preview='a4']").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      aspectDelta: Math.abs(rect.width / rect.height - 210 / 297),
      horizontalOverflow: element.scrollWidth - element.clientWidth,
      verticalOverflow: element.scrollHeight - element.clientHeight
    };
  }));
  expect(metrics.length).toBeGreaterThan(0);
  for (const metric of metrics) {
    expect(metric.aspectDelta).toBeLessThan(0.02);
    expect(metric.horizontalOverflow).toBeLessThanOrEqual(2);
    expect(metric.verticalOverflow).toBeLessThanOrEqual(2);
  }
  await expect(page.locator("[data-cv-page-label='true']")).toHaveCount(metrics.length);
  await expect(page.locator("[data-cv-page-label='true']").first()).toHaveText(`1 / ${metrics.length}`);
  return metrics.length;
}

async function expectCvSectionOnPage(page: Page, section: string, pageIndex: string) {
  const actualPageIndex = await page.locator(`[data-cv-section='${section}']`).first().evaluate((element) =>
    element.closest("[data-cv-preview='a4']")?.getAttribute("data-page-index")
  );
  expect(actualPageIndex).toBe(pageIndex);
}

test("landing intro, hero and command palette work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Abel Valle Rosa" }).first()).toBeVisible();
  await page.getByRole("button", { name: /Saltar intro|Entrar/ }).first().click();
  await expect(page.getByText("IT Project Manager | Delivery Manager").first()).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("option", { name: "Descargar CV" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Cambiar a English" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Acceso secreto admin" })).toBeVisible();
});

test("english landing and online resume route work", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: /Skip intro|Enter/ }).first().click();
  await expect(page.getByText("Available for IT Project / Delivery Management opportunities")).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("option", { name: "Switch to Español" })).toBeVisible();
  await page.goto("/en/cv");
  await expect(page.getByText("Online resume")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to portfolio" })).toHaveAttribute("href", "/en");
});

test("public CV template galleries work in Spanish and English", async ({ page }) => {
  await page.goto("/cv/templates");
  await expect(page.getByRole("heading", { name: "Plantillas de CV" })).toBeVisible();
  await expect(page.getByText("ATS-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver CV online" })).toHaveAttribute("href", "/cv");
  await expect(page.getByRole("link", { name: "Descargar CV" }).first()).toHaveAttribute("href", /\/api\/v1\/cv\/download$/);
  await expect(page.locator("a[download][href*='template=ats-friendly']").first()).toBeVisible();

  await page.goto("/en/cv/templates");
  await expect(page.getByRole("heading", { name: "Resume templates" })).toBeVisible();
  await expect(page.getByText("ATS-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "View resume online" })).toHaveAttribute("href", "/en/cv");
  await expect(page.getByRole("link", { name: "Download resume" }).first()).toHaveAttribute("href", /\/api\/v1\/cv\/download$/);
  await expect(page.locator("a[download][href*='template=ats-friendly']").first()).toBeVisible();
});

test("public CV template detail previews are shareable", async ({ page }) => {
  await page.goto("/cv/templates/minimalista");
  await expect(page.getByRole("heading", { name: "Minimalista" })).toBeVisible();
  await expect(page.getByText("Preview A4")).toBeVisible();
  const spanishPageCount = await expectA4PreviewLayout(page);
  expect(spanishPageCount).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("/cv/templates/minimalista")).toBeVisible();
  await expect(page.getByRole("link", { name: "Todas las plantillas" })).toHaveAttribute("href", "/cv/templates");
  await expect(page.getByRole("link", { name: "Descargar CV" })).toHaveAttribute("href", /\/api\/v1\/cv\/download\?template=minimalista$/);
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-page-size", "A4");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-renderer", "web-preview");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-template", "minimalista");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-page-count", String(spanishPageCount));
  await expect(page.locator("[data-cv-section='contact'] [data-cv-contact-item='true']")).toHaveCount(3);
  await expect(page.locator("[data-cv-section='summary']")).toBeVisible();
  await expect(page.locator("[data-cv-section='languages']")).toContainText("Inglés B1");
  await expect(page.locator("[data-cv-section='projects']")).toContainText("Portfolio Platform");
  await expectCvSectionOnPage(page, "formation", "2");

  await page.goto("/en/cv/templates/ats-friendly");
  await expect(page.getByRole("heading", { name: "ATS-friendly" })).toBeVisible();
  await expect(page.getByText("A4 preview")).toBeVisible();
  const englishPageCount = await expectA4PreviewLayout(page);
  expect(englishPageCount).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("/en/cv/templates/ats-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "All templates" })).toHaveAttribute("href", "/en/cv/templates");
  await expect(page.getByRole("link", { name: "Download resume" })).toHaveAttribute("href", /\/api\/v1\/cv\/download\?template=ats-friendly$/);
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-template", "ats-friendly");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-density", "normal");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-page-count", String(englishPageCount));
  await expectCvSectionOnPage(page, "formation", "2");
});

test("admin publication page is reachable behind the session proxy", async ({ context, page }) => {
  test.setTimeout(90_000);
  let cvBaseDraftJson: Record<string, unknown> | null = null;

  function cvBaseChangedFields() {
    const fields: string[] = [];
    if (!cvBaseDraftJson) {
      return fields;
    }
    if (cvBaseDraftJson.name && cvBaseDraftJson.name !== "CV Base") {
      fields.push("name");
    }
    if (cvBaseDraftJson.slug && cvBaseDraftJson.slug !== "cv-base") {
      fields.push("slug");
    }
    if (cvBaseDraftJson.targetRole && cvBaseDraftJson.targetRole !== "IT Project Manager") {
      fields.push("targetRole");
    }
    if ("structuredJson" in cvBaseDraftJson) {
      fields.push("structuredJson");
    }
    return fields.length ? fields : ["structuredJson"];
  }

  async function confirmJsonSaveIfNeeded() {
    const savedMessage = page.getByText("JSON estructurado guardado.");
    const largeChangeHeading = page.getByRole("heading", { name: "Confirmar cambio grande" });
    await Promise.race([
      savedMessage.waitFor({ state: "visible", timeout: 5000 }).then(() => "saved").catch(() => "none"),
      largeChangeHeading.waitFor({ state: "visible", timeout: 5000 }).then(() => "dialog").catch(() => "none")
    ]);
    if (await largeChangeHeading.isVisible().catch(() => false)) {
      await page.getByRole("dialog", { name: "Confirmar cambio grande" }).getByRole("button", { name: "Guardar JSON" }).focus();
      await page.keyboard.press("Enter");
      await expect(largeChangeHeading).toBeHidden();
    }
    await expect(savedMessage).toBeVisible();
  }

  await context.addCookies([{ name: "accessToken", value: "test-token", url: "http://localhost:3000" }]);
  await page.route("**/api/v1/auth/mfa/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ enabled: false, recoveryCodesRemaining: 0 })
    });
  });
  await page.route("**/api/v1/auth/mfa/setup", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl: "otpauth://totp/Portfolio:abel@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Portfolio"
      })
    });
  });
  await page.route(/\/api\/v1\/contact-messages(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "message-1",
          name: "Recruiter Demo",
          email: "recruiter@example.com",
          subject: "Oferta PM",
          message: "Podemos hablar esta semana?",
          status: "unread",
          createdAt: "2026-06-06T08:00:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/contact-messages/status/bulk", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ count: 1, status: "read" })
    });
  });
  await page.route(/\/api\/v1\/translations(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "translation-1", locale: "en", namespace: "public.hero", key: "downloadCv", value: "Download resume", description: "CTA", visible: true },
        { id: "translation-2", locale: "en", namespace: "public.hero", key: "contact", value: "Contact", description: "CTA", visible: true },
        { id: "translation-3", locale: "en", namespace: "public.command", key: "admin", value: "Secret admin access", description: "Command", visible: false }
      ])
    });
  });
  await page.route("**/api/v1/contact-messages/webhook/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        configured: true,
        hasSecret: true,
        event: "contact.message.created",
        testEvent: "contact.webhook.test",
        timeoutMs: 5000,
        retryAttempts: 2,
        retryDelayMs: 30000
      })
    });
  });
  await page.route("**/api/v1/contact-messages/webhook/settings", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "settings-1",
        enabled: true,
        url: "https://example.com/webhook",
        event: "contact.message.created",
        testEvent: "contact.webhook.test",
        timeoutMs: 5000,
        retryAttempts: 2,
        retryDelayMs: 30000,
        retryWorkerEnabled: true,
        retryWorkerIntervalMs: 60000,
        hasSecret: true,
        source: "database"
      })
    });
  });
  await page.route("**/api/v1/contact-messages/webhook/secret/validate", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        configured: true,
        valid: true,
        signatureHeader: "X-Portfolio-Signature",
        algorithm: "hmac-sha256"
      })
    });
  });
  await page.route("**/api/v1/contact-messages/webhook/deliveries", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "webhook-delivery-1",
          event: "contact.message.created",
          configured: true,
          dispatched: true,
          status: 202,
          messageId: "message-1",
          createdAt: "2026-06-06T08:30:00.000Z"
        },
        {
          id: "webhook-delivery-2",
          event: "contact.message.created",
          configured: true,
          dispatched: false,
          error: "fetch failed",
          messageId: "message-2",
          retryAttempt: 1,
          createdAt: "2026-06-06T08:35:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/contact-messages/webhook/messages/message-2/retry", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        messageId: "message-2",
        dispatched: true,
        status: 200
      })
    });
  });
  await page.route("**/api/v1/integrations/linkedin/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        configured: true,
        profileUrl: "https://www.linkedin.com/in/abelvros/",
        scopes: ["openid", "profile", "email"],
        shareEnabled: true,
        connected: true,
        lastSyncedAt: "2026-06-07T08:00:00.000Z"
      })
    });
  });
  await page.route("**/api/v1/users", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "user-1",
          email: "editor@example.com",
          name: "Editor Demo",
          role: "editor",
          mfaEnabled: false,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        },
        {
          id: "user-2",
          email: "admin@example.com",
          name: "Admin Demo",
          role: "admin",
          mfaEnabled: true,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        },
        {
          id: "user-3",
          email: "viewer1@example.com",
          name: "Viewer Uno",
          role: "viewer",
          mfaEnabled: false,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        },
        {
          id: "user-4",
          email: "viewer2@example.com",
          name: "Viewer Dos",
          role: "viewer",
          mfaEnabled: false,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        },
        {
          id: "user-5",
          email: "viewer3@example.com",
          name: "Viewer Tres",
          role: "viewer",
          mfaEnabled: false,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        },
        {
          id: "user-6",
          email: "viewer4@example.com",
          name: "Viewer Cuatro",
          role: "viewer",
          mfaEnabled: false,
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/users/permissions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        admin: ["manage_users"],
        editor: ["manage_portfolio"],
        viewer: ["read_dashboard"]
      })
    });
  });
  await page.route("**/api/v1/profile", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "profile-1",
        fullName: "Abel Valle Rosa",
        headline: "IT Project Manager | Delivery Manager",
        subtitle: "Gestion agil de proyectos IT",
        shortBio: "Perfil demo",
        longBio: "Perfil publico demo",
        location: "Zaragoza",
        availability: "Disponible",
        email: "abel@example.com",
        phone: null,
        linkedin: "https://www.linkedin.com/in/abelvalle",
        github: null,
        website: null,
        avatarUrl: null,
        cvUrl: "/api/v1/cv/download",
        seoTitle: "Abel Valle Rosa",
        seoDescription: "Portfolio profesional",
        ogImageUrl: null,
        primaryLanguage: "es",
        ctaPrimary: "Descargar CV",
        ctaSecondary: "Contactar",
        publishedAt: "2026-06-06T08:00:00.000Z",
        draftJson: null
      })
    });
  });
  await page.route("**/api/v1/admin/publication/theme/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "theme",
        entityId: "theme-1",
        hasDraft: false,
        publishedAt: "2026-06-06T08:00:00.000Z",
        fields: [
          { field: "primaryColor", before: "#C8A96A", after: "#C8A96A", changed: false }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/profile/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "profile",
        entityId: "profile-1",
        hasDraft: true,
        publishedAt: "2026-06-06T08:00:00.000Z",
        fields: [
          { field: "avatarUrl", before: null, after: "/media/uploads/portfolio-cover.jpg", changed: true },
          { field: "ogImageUrl", before: null, after: null, changed: false }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/changelog", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "change-project",
          entityType: "project",
          entityId: "project-1",
          action: "publish",
          summary: "Proyecto publicado",
          createdAt: "2026-06-06T09:00:00.000Z"
        },
        {
          id: "change-cv",
          entityType: "cv-version",
          entityId: "cv-base",
          action: "publish",
          summary: "Version CV publicada",
          createdAt: "2026-06-06T09:10:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/users/user-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        email: "editor@example.com",
        name: data.name || "Editor Demo",
        role: data.role || "editor",
        mfaEnabled: false,
        createdAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-06T08:00:00.000Z"
      })
    });
  });
  await page.route(/\/api\/v1\/cv$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "cv-1",
        slug: "abel-valle-rosa",
        name: "Abel Valle Rosa",
        headline: "IT Project Manager | Delivery Manager",
        summary: "Gestion IT, delivery, KPIs, UAT y cliente.",
        status: "published",
        isPrimary: true,
        updatedAt: "2026-06-06T08:00:00.000Z"
      })
    });
  });
  await page.route("**/api/v1/cv/cv-1/ats-report", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        score: 88,
        status: "strong",
        checks: [
          { key: "contact", label: "Contacto legible", passed: true, weight: 15, detail: "Contacto en texto plano." },
          { key: "skills", label: "Skills detectables", passed: true, weight: 15, detail: "Skills presentes." }
        ],
        keywords: ["KPIs", "UAT", "Cloud"],
        recommendations: []
      })
    });
  });
  await page.route("**/api/v1/cv/cv-1/ats-role-report", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        score: 88,
        status: "strong",
        targetRole: data.targetRole,
        matchScore: 67,
        checks: [
          { key: "contact", label: "Contacto legible", passed: true, weight: 15, detail: "Contacto en texto plano." }
        ],
        keywords: ["KPIs", "UAT", "Cloud"],
        recommendations: [],
        jobKeywords: ["delivery", "uat", "aws"],
        matchedKeywords: ["uat"],
        missingKeywords: ["aws"],
        roleRecommendations: ['Revisar si "aws" existe en la experiencia real antes de incorporarlo.']
      })
    });
  });
  await page.route("**/api/v1/cv/cv-1/generate-ats-pdf", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        media: {
          id: "media-ats-pdf",
          filename: "cv-ats.pdf",
          originalName: "CV ATS.pdf",
          mimeType: "application/pdf",
          size: 4096,
          url: "/media/generated/cv-ats.pdf",
          type: "cv-generated",
          updatedAt: "2026-06-06T08:40:00.000Z"
        },
        generated: {
          id: "generated-ats-pdf",
          cvVersionId: "cv-base",
          mediaAssetId: "media-ats-pdf",
          type: "pdf",
          url: "/media/generated/cv-ats.pdf",
          createdAt: "2026-06-06T08:40:00.000Z"
        }
      })
    });
  });
  await page.route("**/api/v1/cv/cv-1/generate-ats-docx", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        media: {
          id: "media-ats-docx",
          filename: "cv-ats.docx",
          originalName: "CV ATS.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 4096,
          url: "/media/generated/cv-ats.docx",
          type: "cv-generated",
          updatedAt: "2026-06-06T08:45:00.000Z"
        },
        generated: {
          id: "generated-ats-docx",
          cvVersionId: "cv-base",
          mediaAssetId: "media-ats-docx",
          type: "docx",
          url: "/media/generated/cv-ats.docx",
          createdAt: "2026-06-06T08:45:00.000Z"
        }
      })
    });
  });
  await page.route(/\/api\/v1\/cv-versions\/audit-log(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get("action") || "generate_pdf";
    const resourceId = url.searchParams.get("resourceId") || "cv-base";
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "audit-cv-1",
          userId: "user-1",
          action,
          resource: "cv-version",
          resourceId,
          metadata: action === "update" ? { changedFields: ["status"] } : { mediaAssetId: "media-1" },
          createdAt: "2026-06-06T08:35:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/cv-versions", async (route) => {
    if (route.request().method() === "POST") {
      const data = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "cv-adapted-new",
          cvId: data.cvId,
          name: data.name,
          slug: data.slug,
          targetRole: data.targetRole,
          language: data.language,
          status: "draft",
          isPrimary: false,
          structuredJson: data.structuredJson,
          updatedAt: "2026-06-06T08:30:00.000Z"
        })
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "cv-base", cvId: "cv-1", name: "CV Base", status: "published", targetRole: "IT Project Manager", language: "es", isPrimary: true, structuredJson: { summary: "Gestion IT general.", skills: [], experiences: [{ role: "IT Project Manager", company: "Demo Company", period: "2025", description: "Delivery inicial.", responsibilities: ["Coordinar UAT"] }] }, draftJson: cvBaseDraftJson, publishedAt: "2026-06-01T08:00:00.000Z", updatedAt: "2026-06-01T08:00:00.000Z" },
        { id: "cv-adapted", cvId: "cv-1", name: "CV Adaptado", status: "draft", targetRole: "Delivery Manager", language: "es", isPrimary: false, structuredJson: { summary: "Delivery IT orientado a KPIs.", skills: [] }, draftJson: null, publishedAt: null, updatedAt: "2026-06-02T08:00:00.000Z" }
      ])
    });
  });
  await page.route("**/api/v1/cv-versions/cv-base", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    if ("draftJson" in data) {
      cvBaseDraftJson = data.draftJson;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "cv-base",
        cvId: "cv-1",
        name: "CV Base",
        status: "published",
        language: "es",
        isPrimary: true,
        structuredJson: data.structuredJson || { summary: "Gestion IT general.", skills: [], experiences: [{ role: "IT Project Manager", company: "Demo Company", period: "2025", description: "Delivery inicial.", responsibilities: ["Coordinar UAT"] }] },
        draftJson: cvBaseDraftJson,
        publishedAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-06T09:00:00.000Z"
      })
    });
  });
  await page.route("**/api/v1/admin/publication/cv-versions/cv-base/review", async (route) => {
    const draft = cvBaseDraftJson || { structuredJson: { summary: "Resumen profesional editado por bloques.", skills: [] } };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "cv-version",
        entityId: "cv-base",
        hasDraft: true,
        publishedAt: "2026-06-01T08:00:00.000Z",
        fields: [
          { field: "name", before: "CV Base", after: draft.name ?? "CV Base", changed: Boolean(draft.name && draft.name !== "CV Base") },
          { field: "slug", before: "cv-base", after: draft.slug ?? "cv-base", changed: Boolean(draft.slug && draft.slug !== "cv-base") },
          { field: "targetRole", before: "IT Project Manager", after: draft.targetRole ?? "IT Project Manager", changed: Boolean(draft.targetRole && draft.targetRole !== "IT Project Manager") },
          { field: "structuredJson", before: { summary: "Gestion IT general.", skills: [] }, after: draft.structuredJson ?? { summary: "Resumen profesional editado por bloques.", skills: [] }, changed: "structuredJson" in draft }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/cv-versions/cv-base/publish", async (route) => {
    const changedFields = cvBaseChangedFields();
    cvBaseDraftJson = null;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ changedFields })
    });
  });
  await page.route("**/api/v1/cv-versions/cv-adapted-new/set-primary", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "cv-adapted-new",
        cvId: "cv-1",
        name: "CV adaptado - Delivery Manager",
        status: "published",
        targetRole: "Delivery Manager",
        language: "es",
        isPrimary: true,
        structuredJson: { summary: "Resumen revisado." },
        updatedAt: "2026-06-06T10:00:00.000Z"
      })
    });
  });
  await page.route("**/api/v1/cv/adapt-to-role", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        request: {
          id: "adaptation-1",
          targetRole: "Delivery Manager",
          targetCompany: null,
          status: "pending_review"
        },
        proposed: {
          summary: "Resumen orientado a Delivery Manager.",
          skills: [{ name: "KPIs", category: "Reporting" }, { name: "UAT", category: "Delivery" }],
          experiences: [
            {
              role: "IT Project Manager",
              company: "Demo Company",
              description: "Delivery cloud priorizado.",
              responsibilities: ["Coordinar UAT"],
              achievements: ["Mejorar KPIs"]
            },
            {
              role: "Team Leader",
              company: "Demo Company",
              description: "Gestion tecnica priorizada."
            }
          ],
          adaptationMeta: {
            mode: "rules",
            pendingReview: true,
            keywords: ["delivery", "kpi"],
            guardrail: "No se han inventado datos."
          }
        }
      })
    });
  });
  await page.route(/\/api\/v1\/cv-templates(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "template-ats",
          name: "ATS-friendly",
          slug: "ats-friendly",
          description: "Plantilla demo para ATS.",
          config: { primaryColor: "#111827", fontFamily: "Inter", density: "compact" },
          visible: true,
          order: 0
        }
      ])
    });
  });
  await page.route(/\/api\/v1\/cv-target-roles(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      const data = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "target-role-new",
          name: data.name,
          description: data.description ?? null,
          keywords: data.keywords || [],
          createdAt: "2026-06-06T09:00:00.000Z",
          updatedAt: "2026-06-06T09:00:00.000Z"
        })
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "target-role-1",
          name: "Delivery Manager",
          description: "Delivery y cliente.",
          keywords: ["delivery", "uat", "kpi"],
          createdAt: "2026-06-01T08:00:00.000Z",
          updatedAt: "2026-06-01T08:00:00.000Z"
        }
      ])
    });
  });
  await page.route("**/api/v1/cv-target-roles/target-role-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "target-role-1",
        name: data.name || "Delivery Manager",
        description: data.description ?? "Delivery y cliente.",
        keywords: data.keywords || ["delivery", "uat", "kpi"],
        createdAt: "2026-06-01T08:00:00.000Z",
        updatedAt: "2026-06-06T09:10:00.000Z"
      })
    });
  });
  await page.route("**/api/v1/cv/compare-versions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        summary: { base: "Gestion IT general.", adapted: "Delivery IT orientado a KPIs." },
        skillsOrder: { base: ["Agile", "UAT"], adapted: ["KPIs", "Agile"] },
        highlightedExperience: { base: ["Consultoria"], adapted: ["Delivery Manager"] },
        sectionOrder: { base: ["Resumen", "Experiencia"], adapted: ["Skills", "Resumen"] }
      })
    });
  });
  await page.route(/\/api\/v1\/analytics\/summary(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ totalVisits: 3, cvDownloads: 1, contactSubmits: 1, projectViews: 1 })
    });
  });
  await page.route(/\/api\/v1\/analytics\/timeseries(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const eventType = url.searchParams.get("type");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        eventType === "cv_download"
          ? [{ date: "2026-06-05", total: 1, types: { cv_download: 1 } }]
          : [
              { date: "2026-06-05", total: 1, types: { cv_download: 1 } },
              { date: "2026-06-06", total: 2, types: { landing_visit: 2 } }
            ]
      )
    });
  });
  await page.route(/\/api\/v1\/analytics\/channels(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        sources: [
          { name: "linkedin", count: 2 },
          { name: "direct", count: 1 }
        ],
        channels: [
          { name: "social", count: 2 },
          { name: "direct", count: 1 }
        ]
      })
    });
  });
  await page.route(/\/api\/v1\/analytics\/labels(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        labels: [
          { name: "Delivery Manager", count: 2 },
          { name: "IT Project Manager", count: 1 }
        ],
        paths: [
          { name: "/cv/adapt-to-role?baseCvVersionId=cv-base&targetRoleId=target-role-1", count: 2 },
          { name: "/admin/cv/adapt", count: 1 }
        ],
        contexts: [
          { name: "base=cv-base | role=target-role-1 | company=false", count: 2 },
          { name: "base=cv-alt | company=true", count: 1 }
        ]
      })
    });
  });
  await page.route(/\/api\/v1\/analytics\/funnel(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const steps = url.searchParams.get("steps");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(steps === "landing_visit,project_view,contact_submit"
        ? {
            steps: [
              { key: "landing_visit", label: "Visitas landing", count: 20, rateFromStart: 100, rateFromPrevious: 100 },
              { key: "project_view", label: "Vistas proyecto", count: 10, rateFromStart: 50, rateFromPrevious: 50 },
              { key: "contact_submit", label: "Formularios contacto", count: 2, rateFromStart: 10, rateFromPrevious: 20 }
            ]
          }
        : {
            steps: [
              { key: "landing_visit", label: "Visitas landing", count: 20, rateFromStart: 100, rateFromPrevious: 100 },
              { key: "cv_download", label: "Descargas CV", count: 5, rateFromStart: 25, rateFromPrevious: 25 },
              { key: "contact_submit", label: "Formularios contacto", count: 2, rateFromStart: 10, rateFromPrevious: 40 }
            ]
          })
    });
  });
  await page.route(/\/api\/v1\/analytics\/funnel\/channels(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        segments: [
          {
            source: "linkedin",
            channel: "social",
            landingVisits: 10,
            cvDownloads: 4,
            contactSubmits: 2,
            cvDownloadRate: 40,
            contactRate: 20
          },
          {
            source: "direct",
            channel: "direct",
            landingVisits: 5,
            cvDownloads: 1,
            contactSubmits: 0,
            cvDownloadRate: 20,
            contactRate: 0
          }
        ]
      })
    });
  });
  await page.route("**/api/v1/analytics/privacy", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        retentionDays: 30,
        storeUserAgent: false,
        ipHashSaltConfigured: true
      })
    });
  });
  await page.route("**/api/v1/analytics/retention/prune", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        retentionDays: 30,
        cutoff: "2026-05-07T08:00:00.000Z",
        deleted: 2
      })
    });
  });
  await page.route(/\/api\/v1\/analytics(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const eventType = url.searchParams.get("type");
    const events = [
      { id: "event-1", type: "landing_visit", path: "/", label: "Landing", createdAt: "2026-06-06T08:00:00.000Z" },
      { id: "event-2", type: "landing_visit", path: "/", label: "Landing", createdAt: "2026-06-06T09:00:00.000Z" },
      { id: "event-3", type: "cv_download", path: "/cv", label: "CV", createdAt: "2026-06-05T09:00:00.000Z" }
    ];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(eventType ? events.filter((event) => event.type === eventType) : events)
    });
  });
  let appModules = [
    { id: "module-1", key: "dashboard", name: "Dashboard", enabled: true, order: 1 },
    { id: "module-2", key: "analytics", name: "Analitica", enabled: true, order: 2 },
    { id: "module-3", key: "media", name: "Media", enabled: false, order: 3 }
  ];
  await page.route(/\/api\/v1\/app-modules(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(appModules)
    });
  });
  await page.route(/\/api\/v1\/app-modules\/[^/?]+$/, async (route) => {
    const id = route.request().url().split("/").pop() || "";
    const data = JSON.parse(route.request().postData() || "{}");
    const updatedModule = appModules.find((module) => module.id === id) || appModules[0];
    appModules = appModules.map((module) => module.id === id ? { ...module, ...data } : module);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ...updatedModule, ...data })
    });
  });
  await page.route(/\/api\/v1\/admin\/dashboard(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        cards: {
          totalVisits: 10,
          publishedProjects: 3,
          visibleExperiences: 4,
          receivedMessages: 2,
          primaryCv: "CV Base",
          cvUpdatedAt: "2026-06-06T08:00:00.000Z"
        },
        segments: {
          analytics: {
            landingVisits: 10,
            cvDownloads: 4,
            contactSubmits: 2,
            projectViews: 6
          },
          content: {
            publishedProjects: 3,
            visibleExperiences: 4,
            activeModules: 2,
            totalModules: 3
          },
          cohorts: [
            { period: "2026-05", count: 4 },
            { period: "2026-06", count: 6 }
          ],
          cohortSources: [
            { period: "2026-05", source: "linkedin", channel: "social", count: 4 },
            { period: "2026-06", source: "direct", channel: "direct", count: 3 },
            { period: "2026-06", source: "email", channel: "newsletter", count: 3 }
          ],
          cohortComparisons: [
            { period: "2026-05", count: 4, previousPeriod: "2026-04", previousCount: 0, delta: 4, deltaPercent: 100 },
            { period: "2026-06", count: 6, previousPeriod: "2026-05", previousCount: 4, delta: 2, deltaPercent: 50 }
          ],
          cohortSourceComparisons: [
            { period: "2026-05", source: "linkedin", channel: "social", count: 4, previousPeriod: "2026-04", previousCount: 0, delta: 4, deltaPercent: 100 },
            { period: "2026-06", source: "direct", channel: "direct", count: 3, previousPeriod: "2026-05", previousCount: 0, delta: 3, deltaPercent: 100 },
            { period: "2026-06", source: "email", channel: "newsletter", count: 3, previousPeriod: "2026-05", previousCount: 1, delta: 2, deltaPercent: 200 }
          ],
          kpiGoals: {
            total: 2,
            achieved: 1,
            atRisk: 1,
            items: [
              {
                id: "goal-1",
                key: "sample-cv-downloads",
                name: "Descargas CV sample/demo",
                eventType: "cv_download",
                eventTypes: ["cv_download"],
                targetCount: 3,
                count: 3,
                progressRate: 100,
                achieved: true,
                remainingCount: 0,
                alertLevel: "success"
              },
              {
                id: "goal-2",
                key: "sample-engagement-actions",
                name: "Acciones de interes sample/demo",
                eventType: "project_view",
                eventTypes: ["project_view", "cv_download", "contact_submit"],
                targetCount: 6,
                count: 2,
                progressRate: 33.3,
                achieved: false,
                remainingCount: 4,
                alertLevel: "warning"
              }
            ]
          }
        },
        latestChanges: [],
        modules: appModules
      })
    });
  });
  await page.route(/\/api\/v1\/projects(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "project-1",
          name: "Portfolio Platform",
          slug: "portfolio-platform",
          description: "Proyecto demo",
          status: "published",
          categoryName: "Portfolio",
          technologies: ["Next.js", "NestJS"],
          imageUrl: null,
          publicUrl: null,
          repositoryUrl: null,
          featured: true,
          visible: true,
          sample: false,
          order: 0,
          draftJson: null,
          publishedAt: null
        },
        {
          id: "project-2",
          name: "Sample Backoffice",
          slug: "sample-backoffice",
          description: "Proyecto sample para pruebas de reordenado.",
          status: "draft",
          categoryName: "Demo",
          technologies: ["Next.js"],
          imageUrl: null,
          publicUrl: null,
          repositoryUrl: null,
          featured: false,
          visible: false,
          sample: true,
          order: 1,
          draftJson: null,
          publishedAt: null
        }
      ])
    });
  });
  await page.route(/\/api\/v1\/project-categories(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      const data = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "project-category-new",
          name: data.name,
          order: data.order ?? 1,
          visible: data.visible ?? true
        })
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "project-category-1",
          name: "Portfolio",
          order: 0,
          visible: true
        }
      ])
    });
  });
  await page.route("**/api/v1/project-categories/project-category-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "project-category-1",
        name: "Portfolio",
        order: 0,
        visible: data.visible ?? false
      })
    });
  });
  await page.route("**/api/v1/projects/project-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "project-1",
        name: data.name || "Portfolio Platform",
        slug: data.slug || "portfolio-platform",
        description: data.description || "Proyecto demo",
        status: data.status || "archived",
        categoryName: data.categoryName || "Portfolio",
        technologies: data.technologies || ["Next.js", "NestJS"],
        imageUrl: data.imageUrl ?? null,
        publicUrl: data.publicUrl ?? null,
        repositoryUrl: data.repositoryUrl ?? null,
        featured: data.featured ?? true,
        visible: data.visible ?? false,
        sample: data.sample ?? false,
        order: data.order ?? 0,
        draftJson: data.draftJson ?? null,
        publishedAt: null
      })
    });
  });
  await page.route("**/api/v1/admin/publication/projects/project-1/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "project",
        entityId: "project-1",
        hasDraft: true,
        publishedAt: null,
        fields: [
          { field: "name", before: "Portfolio Platform", after: "Portfolio Platform Pro", changed: true },
          { field: "slug", before: "portfolio-platform", after: "portfolio-platform-pro", changed: true },
          { field: "description", before: "Proyecto demo", after: "Proyecto portfolio ampliado.", changed: true },
          { field: "technologies", before: ["Next.js", "NestJS"], after: ["Next.js", "NestJS", "Prisma"], changed: true },
          { field: "imageUrl", before: null, after: "/media/uploads/portfolio-cover.jpg", changed: true }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/projects/project-1/publish", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        changedFields: ["name", "slug", "description", "technologies", "imageUrl"]
      })
    });
  });
  await page.route(/\/api\/v1\/skills(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "skill-1",
          name: "Scrum",
          categoryName: "Agile",
          level: "Avanzado",
          order: 0,
          visible: true,
          draftJson: null,
          publishedAt: null
        },
        {
          id: "skill-2",
          name: "Sample Reporting",
          categoryName: "Demo",
          level: "Intermedio",
          order: 1,
          visible: false,
          draftJson: null,
          publishedAt: null
        },
        {
          id: "skill-3",
          name: "Ingles B1",
          categoryName: "Idiomas",
          level: "B1",
          order: 2,
          visible: true,
          draftJson: null,
          publishedAt: null
        }
      ])
    });
  });
  await page.route(/\/api\/v1\/skill-categories(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      const data = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "category-new",
          name: data.name,
          order: data.order ?? 1,
          visible: data.visible ?? true
        })
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "category-1",
          name: "Agile",
          order: 0,
          visible: true
        }
      ])
    });
  });
  await page.route("**/api/v1/skill-categories/category-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "category-1",
        name: "Agile",
        order: 0,
        visible: data.visible ?? false
      })
    });
  });
  await page.route("**/api/v1/skills/skill-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "skill-1",
        name: data.name || "Scrum",
        categoryName: data.categoryName || "Agile",
        level: data.level || "Avanzado",
        order: data.order ?? 0,
        visible: data.visible ?? true,
        draftJson: data.draftJson ?? null,
        publishedAt: null
      })
    });
  });
  await page.route("**/api/v1/admin/publication/skills/skill-1/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "skill",
        entityId: "skill-1",
        hasDraft: true,
        publishedAt: null,
        fields: [
          { field: "name", before: "Scrum", after: "Scrum avanzado", changed: true },
          { field: "level", before: "Avanzado", after: "Experto", changed: true }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/skills/skill-1/publish", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ changedFields: ["name", "level"] })
    });
  });
  await page.route(/\/api\/v1\/education(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "education-1",
          title: "Project Management",
          institution: "Demo Institute",
          date: "2025",
          description: "Formacion demo",
          type: "course",
          certificateUrl: null,
          attachmentId: null,
          order: 0,
          visible: true,
          draftJson: null,
          publishedAt: null
        },
        {
          id: "education-2",
          title: "Sample Training",
          institution: "Demo Institute",
          date: "2024",
          description: "Estudio sample para pruebas de reordenado.",
          type: "course",
          certificateUrl: null,
          attachmentId: null,
          order: 1,
          visible: false,
          draftJson: null,
          publishedAt: null
        }
      ])
    });
  });
  await page.route("**/api/v1/education/education-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "education-1",
        title: data.title || "Project Management",
        institution: data.institution || "Demo Institute",
        date: data.date || "2025",
        description: data.description ?? "Formacion demo",
        type: data.type || "course",
        certificateUrl: data.certificateUrl ?? null,
        attachmentId: data.attachmentId ?? null,
        order: data.order ?? 0,
        visible: data.visible ?? true,
        draftJson: data.draftJson ?? null,
        publishedAt: null
      })
    });
  });
  await page.route("**/api/v1/admin/publication/education/education-1/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "education",
        entityId: "education-1",
        hasDraft: true,
        publishedAt: null,
        fields: [
          { field: "title", before: "Project Management", after: "Project Management avanzado", changed: true },
          { field: "date", before: "2025", after: "2026", changed: true },
          { field: "description", before: "Formacion demo", after: "Programa ampliado de gestion.", changed: true },
          { field: "attachmentId", before: null, after: "media-1", changed: true }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/education/education-1/publish", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ changedFields: ["title", "date", "description", "attachmentId"] })
    });
  });
  await page.route(/\/api\/v1\/certifications(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "certification-1",
          title: "Scrum Master",
          institution: "Demo Academy",
          date: "2025",
          description: "Certificacion demo",
          certificateUrl: null,
          attachmentId: null,
          order: 0,
          visible: true,
          draftJson: null,
          publishedAt: null
        },
        {
          id: "certification-2",
          title: "Sample Certification",
          institution: "Demo Academy",
          date: "2024",
          description: "Certificacion sample para pruebas de reordenado.",
          certificateUrl: null,
          attachmentId: null,
          order: 1,
          visible: false,
          draftJson: null,
          publishedAt: null
        }
      ])
    });
  });
  await page.route("**/api/v1/certifications/certification-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "certification-1",
        title: data.title || "Scrum Master",
        institution: data.institution || "Demo Academy",
        date: data.date || "2025",
        description: data.description ?? "Certificacion demo",
        certificateUrl: data.certificateUrl ?? null,
        attachmentId: data.attachmentId ?? null,
        order: data.order ?? 0,
        visible: data.visible ?? true,
        draftJson: data.draftJson ?? null,
        publishedAt: null
      })
    });
  });
  await page.route("**/api/v1/admin/publication/certifications/certification-1/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "certification",
        entityId: "certification-1",
        hasDraft: true,
        publishedAt: null,
        fields: [
          { field: "title", before: "Scrum Master", after: "Scrum Master avanzado", changed: true },
          { field: "date", before: "2025", after: "2026", changed: true },
          { field: "description", before: "Certificacion demo", after: "Certificacion ampliada de agilidad.", changed: true },
          { field: "attachmentId", before: null, after: "media-1", changed: true }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/certifications/certification-1/publish", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ changedFields: ["title", "date", "description", "attachmentId"] })
    });
  });
  await page.route(/\/api\/v1\/experiences(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "experience-1",
          company: "Demo Company",
          role: "IT Project Manager",
          startDate: "2025-01-01",
          endDate: null,
          current: true,
          location: "Zaragoza",
          modality: "hybrid",
          description: "Experiencia demo",
          achievements: [],
          responsibilities: [],
          technologies: ["Next.js", "NestJS"],
          methodologies: [],
          skills: [],
          order: 0,
          visible: true,
          featured: true
        },
        {
          id: "experience-2",
          company: "Demo Support Company",
          role: "Sample Delivery Role",
          startDate: "2024-01-01",
          endDate: "2024-06-01",
          current: false,
          location: "Demo",
          modality: "remote",
          description: "Experiencia sample para pruebas de reordenado.",
          achievements: [],
          responsibilities: [],
          technologies: ["Prisma"],
          methodologies: [],
          skills: [],
          order: 1,
          visible: false,
          featured: false
        }
      ])
    });
  });
  await page.route("**/api/v1/experiences/experience-1", async (route) => {
    const data = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "experience-1",
        company: data.company || "Demo Company",
        role: data.role || "IT Project Manager",
        startDate: data.startDate || "2025-01-01",
        endDate: data.endDate ?? null,
        current: data.current ?? true,
        location: data.location || "Zaragoza",
        modality: data.modality || "hybrid",
        description: data.description || "Experiencia demo",
        achievements: data.achievements || [],
        responsibilities: data.responsibilities || [],
        technologies: data.technologies || [],
        methodologies: data.methodologies || [],
        skills: data.skills || [],
        order: data.order ?? 0,
        visible: data.visible ?? true,
        featured: data.featured ?? true
      })
    });
  });
  await page.route("**/api/v1/admin/publication/experiences/experience-1/review", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        entityType: "experience",
        entityId: "experience-1",
        hasDraft: true,
        publishedAt: "2026-06-06T08:00:00.000Z",
        fields: [
          { field: "role", before: "IT Project Manager", after: "Delivery Manager", changed: true },
          { field: "description", before: "Experiencia demo", after: "Experiencia ampliada en delivery y reporting.", changed: true },
          { field: "technologies", before: [], after: ["Next.js", "NestJS"], changed: true }
        ],
        latestChanges: []
      })
    });
  });
  await page.route("**/api/v1/admin/publication/experiences/experience-1/publish", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ changedFields: ["role", "description", "technologies"] })
    });
  });
  await page.route("**/api/v1/media/storage/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        provider: "local",
        storageDir: "storage",
        maxFileSizeMb: 10,
        quotaMb: 250,
        signatureScanEnabled: true,
        assetCount: 1,
        usedBytes: 2048,
        usedMb: 0,
        allowedMimeTypes: ["application/pdf"],
        uploadEndpoint: "/api/v1/media/upload",
        downloadPattern: "/api/v1/media/:id/download"
      })
    });
  });
  await page.route(/\/api\/v1\/media(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "media-1",
          filename: "cv-demo.pdf",
          originalName: "CV Demo.pdf",
          mimeType: "application/pdf",
          size: 2048,
          url: "/media/uploads/cv-demo.pdf",
          type: "cv-manual",
          updatedAt: "2026-06-06T08:00:00.000Z"
        },
        {
          id: "media-2",
          filename: "portfolio-cover.jpg",
          originalName: "Portfolio Cover.jpg",
          mimeType: "image/jpeg",
          size: 4096,
          url: "/media/uploads/portfolio-cover.jpg",
          type: "project-image",
          updatedAt: "2026-06-06T08:05:00.000Z"
        }
      ])
    });
  });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.locator("nav a[href='/admin/analytics']")).toHaveCount(1);
  await expect(page.locator("nav a[href='/admin/media']")).toHaveCount(0);
  await expect(page.locator("nav a[href='/admin/settings/modules']")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Visitas landing/ })).toBeVisible();
  await expect(page.getByText("Pulso operativo")).toBeVisible();
  await expect(page.getByText("Segmentacion operativa")).toBeVisible();
  await expect(page.getByText("Cohorts mensuales")).toBeVisible();
  await expect(page.getByText("2026-06", { exact: true })).toBeVisible();
  await expect(page.getByText("Fuentes por mes")).toBeVisible();
  await expect(page.getByText("2026-06 - email/newsletter").first()).toBeVisible();
  await expect(page.getByText("Comparativa cohorts")).toBeVisible();
  await expect(page.getByText("2026-06 vs 2026-05")).toBeVisible();
  await expect(page.getByText("+2 (+50%)")).toBeVisible();
  await expect(page.getByText("cv_download").first()).toBeVisible();
  await expect(page.getByText("Objetivos KPI")).toBeVisible();
  await expect(page.getByText("Acciones de interes sample/demo")).toBeVisible();
  await expect(page.getByText("project_view + cv_download + contact_submit")).toBeVisible();
  await expect(page.getByText("Conversion contacto")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ver eventos/ })).toHaveAttribute("href", "/admin/analytics");

  await page.goto("/admin/settings/publication");
  await expect(page.getByRole("heading", { name: "Revision de publicacion" })).toBeVisible();
  await expect(page.getByText("Draft / Publish")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir proyecto" })).toHaveAttribute("href", "/admin/portfolio/projects?projectId=project-1");
  await expect(page.getByRole("link", { name: "Abrir version CV" })).toHaveAttribute("href", "/admin/cv/versions?versionId=cv-base");

  await page.goto("/admin/portfolio");
  await expect(page.getByRole("heading", { name: "Perfil publico" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await page.getByLabel("Avatar media").selectOption("/media/uploads/portfolio-cover.jpg");
  await expect(page.getByLabel("Avatar URL")).toHaveValue("/media/uploads/portfolio-cover.jpg");
  await page.getByLabel("Open Graph media").selectOption("/media/uploads/portfolio-cover.jpg");
  await expect(page.getByLabel("Open Graph image")).toHaveValue("/media/uploads/portfolio-cover.jpg");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de perfil guardado.")).toBeVisible();

  await page.goto("/admin/portfolio/theme");
  await expect(page.getByText("Editor visual de estilos")).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByText("Contraste y accesibilidad")).toBeVisible();
  await expect(page.getByText("Texto / fondo")).toBeVisible();

  await page.goto("/admin/portfolio/experience");
  await expect(page.getByRole("heading", { name: "Experiencia profesional" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByRole("main").getByText("Demo Company")).toBeVisible();
  await expect(page.getByText("Asociar skills registradas").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Scrum" }).first()).toBeVisible();
  await expect(page.getByText("Asociar tecnologias usadas").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Next.js" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Editar Demo Company" }).click();
  await expect(page.getByRole("heading", { name: "Editar experiencia" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Editar experiencia" }).getByRole("button", { name: "Scrum" })).toBeVisible();
  await page.getByLabel("Empresa experiencia").fill("Demo Company Updated");
  await page.getByLabel("Cargo experiencia").fill("Delivery Manager");
  await page.getByLabel("Descripcion experiencia").fill("Experiencia ampliada en delivery y reporting.");
  await page.getByLabel("technologies experiencia").fill("Next.js\nNestJS");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de experiencia guardado: Demo Company Updated.")).toBeVisible();
  await expect(page.getByText("Revision borrador experiencia")).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador de experiencia publicado. Campos modificados: role, description, technologies.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Demo Company" })).toBeVisible();
  await expect(page.locator("[data-cms-experience-id='experience-1']")).toHaveAttribute("draggable", "true");
  await expect(page.locator("[data-cms-experience-id='experience-2']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Subir Demo Company" }).click();
  await expect(page.getByText("Experiencia reordenada: Demo Company.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Demo Company" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/projects");
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByRole("main").getByText("Portfolio Platform")).toBeVisible();
  await expect(page.getByRole("button", { name: /Portfolio visible/ })).toBeVisible();
  await page.getByLabel("Categoria nueva").fill("Producto");
  await page.getByRole("button", { name: "Crear categoria" }).click();
  await expect(page.getByText("Categoria creada: Producto.")).toBeVisible();
  await page.getByRole("button", { name: /Portfolio visible/ }).click();
  await expect(page.getByText("Categoria ocultada: Portfolio.")).toBeVisible();
  await page.getByRole("button", { name: "Editar Portfolio Platform" }).click();
  await expect(page.getByRole("heading", { name: "Editar proyecto" })).toBeVisible();
  await page.getByLabel("Nombre proyecto").fill("Portfolio Platform Pro");
  await page.getByLabel("Descripcion proyecto").fill("Proyecto portfolio ampliado.");
  await page.getByLabel("Tecnologias proyecto").fill("Next.js\nNestJS\nPrisma");
  await page.getByLabel("Imagen media proyecto").selectOption("/media/uploads/portfolio-cover.jpg");
  await expect(page.getByLabel("Imagen proyecto")).toHaveValue("/media/uploads/portfolio-cover.jpg");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de proyecto guardado: Portfolio Platform Pro.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revision borrador proyecto" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador de proyecto publicado. Campos modificados: name, slug, description, technologies, imageUrl.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Portfolio Platform" })).toBeVisible();
  await expect(page.locator("[data-cms-project-id='project-1']")).toHaveAttribute("draggable", "true");
  await expect(page.locator("[data-cms-project-id='project-2']")).toHaveAttribute("draggable", "true");
  await page.locator("[data-cms-project-id='project-1']").dispatchEvent("dragstart");
  await page.locator("[data-cms-project-id='project-2']").dispatchEvent("dragover");
  await page.locator("[data-cms-project-id='project-2']").dispatchEvent("drop");
  await expect(page.getByText("Proyecto reordenado: Portfolio Platform.")).toBeVisible();
  await page.getByRole("button", { name: "Subir Portfolio Platform" }).click();
  await expect(page.getByText("Proyecto reordenado: Portfolio Platform.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Portfolio Platform" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/skills");
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByRole("main").getByText("Scrum")).toBeVisible();
  await expect(page.getByRole("button", { name: /Agile visible/ })).toBeVisible();
  await page.getByLabel("Categoria nueva").fill("Cloud");
  await page.getByRole("button", { name: "Crear categoria" }).click();
  await expect(page.getByText("Categoria creada: Cloud.")).toBeVisible();
  await page.getByRole("button", { name: /Agile visible/ }).click();
  await expect(page.getByText("Categoria ocultada: Agile.")).toBeVisible();
  await page.getByRole("button", { name: "Editar Scrum" }).click();
  await expect(page.getByRole("heading", { name: "Editar skill" })).toBeVisible();
  await page.getByLabel("Nombre skill").fill("Scrum avanzado");
  await page.getByLabel("Categoria skill").fill("Agile");
  await page.getByLabel("Nivel skill").selectOption("Experto");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de skill guardado: Scrum avanzado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revision borrador skill" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador de skill publicado. Campos modificados: name, level.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Scrum" })).toBeVisible();
  await expect(page.locator("[data-cms-skill-id='skill-1']")).toHaveAttribute("draggable", "true");
  await expect(page.locator("[data-cms-skill-id='skill-2']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Subir Scrum" }).click();
  await expect(page.getByText("Skill reordenada: Scrum.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/education");
  await expect(page.getByRole("heading", { name: "Estudios" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByRole("main").getByText("Project Management")).toBeVisible();
  await page.getByRole("button", { name: "Editar Project Management" }).click();
  await expect(page.getByRole("heading", { name: "Editar estudio" })).toBeVisible();
  await page.getByLabel("Titulo estudio").fill("Project Management avanzado");
  await page.getByLabel("Institucion estudio").fill("Demo Institute");
  await page.getByLabel("Fecha estudio").fill("2026");
  await page.getByLabel("Descripcion estudio").fill("Programa ampliado de gestion.");
  await page.getByLabel("Adjunto media estudio").selectOption("media-1");
  await expect(page.getByLabel("Adjunto ID estudio")).toHaveValue("media-1");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de estudio guardado: Project Management avanzado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revision borrador estudio" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador de estudio publicado. Campos modificados: title, date, description, attachmentId.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Project Management" })).toBeVisible();
  await expect(page.locator("[data-cms-education-id='education-1']")).toHaveAttribute("draggable", "true");
  await expect(page.locator("[data-cms-education-id='education-2']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Subir Project Management" }).click();
  await expect(page.getByText("Estudio reordenado: Project Management.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Project Management" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/certifications");
  await expect(page.getByRole("heading", { name: "Certificaciones" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial y restore" })).toHaveAttribute("href", "/admin/settings/publication");
  await expect(page.getByRole("main").getByText("Scrum Master")).toBeVisible();
  await page.getByRole("button", { name: "Editar Scrum Master" }).click();
  await expect(page.getByRole("heading", { name: "Editar certificacion" })).toBeVisible();
  await page.getByLabel("Titulo certificacion").fill("Scrum Master avanzado");
  await page.getByLabel("Institucion certificacion").fill("Demo Academy");
  await page.getByLabel("Fecha certificacion").fill("2026");
  await page.getByLabel("Descripcion certificacion").fill("Certificacion ampliada de agilidad.");
  await page.getByLabel("Adjunto media certificacion").selectOption("media-1");
  await expect(page.getByLabel("Adjunto ID certificacion")).toHaveValue("media-1");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByText("Borrador de certificacion guardado: Scrum Master avanzado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revision borrador certificacion" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador de certificacion publicado. Campos modificados: title, date, description, attachmentId.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Scrum Master" })).toBeVisible();
  await expect(page.locator("[data-cms-certification-id='certification-1']")).toHaveAttribute("draggable", "true");
  await expect(page.locator("[data-cms-certification-id='certification-2']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Subir Scrum Master" }).click();
  await expect(page.getByText("Certificacion reordenada: Scrum Master.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum Master" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/cv/versions");
  await expect(page.getByRole("heading", { name: "Versiones de CV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Auditoria reciente CV" })).toBeVisible();
  await expect(page.getByLabel("Evento generate_pdf")).toBeVisible();
  await page.getByRole("button", { name: "Ver auditoria generate_pdf" }).click();
  const auditDialog = page.getByRole("dialog", { name: "Detalle auditoria CV" });
  await expect(auditDialog).toBeVisible();
  await expect(auditDialog.getByText("mediaAssetId", { exact: true })).toBeVisible();
  await expect(auditDialog.getByText("media-1", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Detalle auditoria CV" })).toBeHidden();
  const versionAuditRequestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith("/api/v1/cv-versions/audit-log")
      && url.searchParams.get("resourceId") === "cv-base"
      && url.searchParams.get("page") === "1";
  });
  await page.getByRole("button", { name: "Ver auditoria CV Base" }).click({ force: true });
  await versionAuditRequestPromise;
  await expect(page.getByLabel("Version auditoria")).toHaveValue("cv-base");
  await expect(page.getByText("Auditoria filtrada por version: CV Base.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Timeline version CV" })).toBeVisible();
  await expect(page.getByLabel("Timeline auditoria version").getByText("cv-base")).toBeVisible();
  await page.getByLabel("Accion").selectOption("update");
  await expect(page.getByLabel("Evento update")).toBeVisible();
  const auditFilterRequestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith("/api/v1/cv-versions/audit-log")
      && url.searchParams.get("action") === "update"
      && url.searchParams.get("resourceId") === "cv-base"
      && url.searchParams.get("from") === "2026-06-01"
      && url.searchParams.get("to") === "2026-06-06"
      && url.searchParams.get("userId") === "user-1";
  });
  await page.getByLabel("Desde").fill("2026-06-01");
  await page.getByLabel("Hasta").fill("2026-06-06");
  await page.getByLabel("Usuario auditoria").fill("user-1");
  await auditFilterRequestPromise;
  await expect(page.getByText("Pagina 1")).toBeVisible();
  const auditPageRequestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith("/api/v1/cv-versions/audit-log")
      && url.searchParams.get("action") === "update"
      && url.searchParams.get("page") === "2"
      && url.searchParams.get("limit") === "6";
  });
  await expect(page.getByRole("button", { name: "Siguiente auditoria" })).toBeEnabled();
  await page.getByRole("button", { name: "Siguiente auditoria" }).click();
  await auditPageRequestPromise;
  await expect(page.getByText("Pagina 2")).toBeVisible();
  const auditDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar auditoria CSV" }).click();
  const auditDownload = await auditDownloadPromise;
  expect(auditDownload.suggestedFilename()).toBe("cv-version-audit-update.csv");
  await expect(page.getByText("CSV de auditoria CV generado.")).toBeVisible();
  const auditHistoryHref = await page.getByRole("link", { name: "Exportar historico CSV" }).getAttribute("href");
  expect(auditHistoryHref).toContain("/api/v1/cv-versions/audit-log/export");
  expect(auditHistoryHref).toContain("action=update");
  expect(auditHistoryHref).toContain("resourceId=cv-base");
  expect(auditHistoryHref).toContain("from=2026-06-01");
  expect(auditHistoryHref).toContain("to=2026-06-06");
  expect(auditHistoryHref).toContain("userId=user-1");
  const publicationHistoryRequestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith("/api/v1/cv-versions/audit-log")
      && url.searchParams.get("action") === "set_primary"
      && !url.searchParams.has("resourceId")
      && url.searchParams.get("page") === "1";
  });
  await page.getByRole("button", { name: "Ver publicaciones CV" }).click();
  await publicationHistoryRequestPromise;
  await expect(page.getByLabel("Accion")).toHaveValue("set_primary");
  await expect(page.getByLabel("Version auditoria")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Historial publicaciones CV" })).toBeVisible();
  await expect(page.getByLabel("Plantilla", { exact: true })).toBeVisible();
  await expect(page.getByLabel("JSON estructurado")).toBeVisible();
  await expect(page.locator("#structuredJsonVersion")).toHaveValue("cv-base");
  await expect(page.getByLabel("Rol experiencia")).toHaveValue("IT Project Manager");
  await expect(page.getByLabel("Orden visual CV").locator("[data-cv-section-order-item='summary']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Bajar bloque summary" }).click();
  await expect(page.getByLabel("Orden de bloques CV")).toHaveValue(/^experiences\nsummary/);
  await page.getByRole("button", { name: "Insertar salto de pagina" }).click();
  await expect(page.getByLabel("Orden de bloques CV")).toHaveValue(/sections\npage-break$/);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "Subir bloque page-break" }).click();
  }
  await expect(page.getByLabel("Orden de bloques CV")).toHaveValue(/^experiences\nsummary\npage-break/);
  await expect(page.getByLabel("Orden visual CV").locator("[data-cv-section-order-item='page-break']")).toContainText("Salto de pagina");
  await page.getByRole("button", { name: "Aplicar orden de bloques" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"sectionOrder\": \[\s+\"experiences\",\s+\"summary\",\s+\"page-break\"/);
  await page.getByRole("button", { name: "Duplicar", exact: true }).first().click({ force: true });
  await expect(page.getByText("Version duplicada: CV Base copia.")).toBeVisible();
  await page.getByLabel("Resumen profesional CV").fill("Resumen profesional editado por bloques.");
  await page.getByRole("button", { name: "Aplicar resumen" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Resumen profesional editado por bloques/);
  await page.getByRole("button", { name: "Guardar borrador CV" }).click();
  await expect(page.getByText("Borrador CV guardado: CV Base.")).toBeVisible();
  await expect(page.getByLabel("Revision borrador CV")).toBeVisible();
  await expect(page.getByText("structuredJson")).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador CV" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Borrador CV publicado. Campos modificados: structuredJson.")).toBeVisible();
  await page.getByLabel("Nombre borrador CV").fill("CV Base Ejecutivo");
  await page.getByLabel("Puesto borrador CV").fill("Delivery Manager");
  await page.getByRole("button", { name: "Guardar metadatos CV" }).click();
  await expect(page.getByText("Borrador de metadatos CV guardado: CV Base Ejecutivo.")).toBeVisible();
  await expect(page.getByLabel("Revision borrador CV").getByText("name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Revision borrador CV").getByText("CV Base Ejecutivo")).toBeVisible();
  await page.getByRole("button", { name: "Publicar borrador CV" }).click();
  await expect(page.getByText("Borrador CV publicado. Campos modificados: name, slug, targetRole.")).toBeVisible();
  await page.getByRole("button", { name: "Guardar JSON" }).click({ force: true });
  await expect(page.getByText("JSON estructurado guardado.")).toBeVisible();
  await page.getByLabel("Skills CV").fill("KPIs\nUAT");
  await page.getByRole("button", { name: "Aplicar skills" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"name\": \"KPIs\"/);
  await expect(page.getByLabel("Nombre skill CV")).toHaveValue("KPIs");
  await page.getByLabel("Categoria skill CV").fill("Reporting");
  await page.getByLabel("Nivel skill CV").fill("Avanzado");
  await page.getByRole("button", { name: "Aplicar skill granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"category\": \"Reporting\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"level\": \"Avanzado\"/);
  await page.getByRole("button", { name: "Duplicar skill granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/KPIs copia/);
  await page.getByRole("button", { name: "Eliminar skill granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).not.toHaveValue(/KPIs copia/);
  await page.locator("#skillFormIndex").selectOption("2");
  await page.getByLabel("Nombre skill CV").fill("Cloud");
  await page.getByLabel("Categoria skill CV").fill("Cloud");
  await page.getByLabel("Nivel skill CV").fill("Intermedio");
  await page.getByRole("button", { name: "Aplicar skill granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"name\": \"Cloud\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"level\": \"Intermedio\"/);
  await page.getByRole("button", { name: "Eliminar skill granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).not.toHaveValue(/\"name\": \"Cloud\"/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Idiomas CV").fill("Español - Nativo\nIngles - Intermedio");
  await page.getByRole("button", { name: "Aplicar idiomas" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"level\": \"Nativo\"/);
  await expect(page.getByLabel("Nombre idioma CV")).toHaveValue(/Espa/);
  await page.getByLabel("Nivel idioma CV").fill("Nativo profesional");
  await page.getByRole("button", { name: "Aplicar idioma granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Nativo profesional/);
  await page.getByRole("button", { name: "Duplicar idioma granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/copia/);
  await page.getByRole("button", { name: "Eliminar idioma granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).not.toHaveValue(/copia/);
  await page.locator("#languageFormIndex").selectOption("2");
  await page.getByLabel("Nombre idioma CV").fill("Frances");
  await page.getByLabel("Nivel idioma CV").fill("Basico");
  await page.getByRole("button", { name: "Aplicar idioma granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"name\": \"Frances\"/);
  await page.getByRole("button", { name: "Eliminar idioma granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).not.toHaveValue(/\"name\": \"Frances\"/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Proyectos CV").fill("Portfolio Platform\nCV Manager");
  await page.getByRole("button", { name: "Aplicar proyectos" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"name\": \"Portfolio Platform\"/);
  await expect(page.getByLabel("Nombre proyecto CV")).toHaveValue("Portfolio Platform");
  await page.getByLabel("Categoria proyecto CV").fill("Portfolio");
  await page.getByLabel("Estado proyecto CV").fill("published");
  await page.getByLabel("Descripcion proyecto CV").fill("Plataforma profesional de portfolio y CV.");
  await page.getByRole("button", { name: "Aplicar proyecto granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"category\": \"Portfolio\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"status\": \"published\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Plataforma profesional de portfolio y CV/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Educacion CV", { exact: true }).fill("Project Management - Demo Institute - 2026");
  await page.getByRole("button", { name: "Aplicar educacion", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"title\": \"Project Management\"/);
  await expect(page.getByLabel("Titulo educacion CV")).toHaveValue("Project Management");
  await page.getByLabel("Tipo educacion CV").fill("curso");
  await page.getByLabel("Descripcion educacion CV").fill("Formacion demo pendiente de validacion.");
  await page.getByLabel("URL educacion CV").fill("https://example.com/formacion");
  await page.getByRole("button", { name: "Aplicar educacion granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"type\": \"curso\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"url\": \"https:\/\/example\.com\/formacion\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Formacion demo pendiente de validacion/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Certificaciones CV", { exact: true }).fill("Scrum Master - Demo Academy - 2026");
  await page.getByRole("button", { name: "Aplicar certificaciones", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"title\": \"Scrum Master\"/);
  await expect(page.getByLabel("Titulo certificacion CV")).toHaveValue("Scrum Master");
  await page.getByLabel("URL certificado CV").fill("https://example.com/certificado");
  await page.getByLabel("ID credencial certificacion CV").fill("SCRUM-DEMO-2026");
  await page.getByLabel("Descripcion certificacion CV").fill("Certificacion demo pendiente de validacion.");
  await page.getByRole("button", { name: "Aplicar certificacion granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"certificateUrl\": \"https:\/\/example.com\/certificado\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"credentialId\": \"SCRUM-DEMO-2026\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Certificacion demo pendiente de validacion/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Experiencia CV").fill("Delivery Manager - Demo Company - 2026");
  await page.getByRole("button", { name: "Aplicar experiencia", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"role\": \"Delivery Manager\"/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("Secciones personalizadas CV", { exact: true }).fill("Publicaciones: Seccion demo pendiente de revision\nCharlas: Demo pendiente de revision");
  await page.getByRole("button", { name: "Aplicar secciones" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"title\": \"Publicaciones\"/);
  await page.getByLabel("Orden de bloques CV").fill("skills\nsummary\nexperiences\nformation\nlanguages\nprojects\nsections");
  await page.getByRole("button", { name: "Aplicar orden de bloques" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"sectionOrder\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"skills\"/);
  await page.getByRole("button", { name: "Duplicar seccion" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Publicaciones copia/);
  await page.getByRole("button", { name: "Bajar seccion", exact: true }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"title\": \"Charlas\"[\s\S]*\"title\": \"Publicaciones copia\"/);
  await expect(page.getByLabel("Secciones visuales CV").locator("[data-cv-custom-section-index='2']")).toHaveAttribute("draggable", "true");
  await page.getByRole("button", { name: "Subir seccion Publicaciones copia" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"title\": \"Publicaciones\"[\s\S]*\"title\": \"Publicaciones copia\"[\s\S]*\"title\": \"Charlas\"/);
  await page.getByRole("button", { name: "Guardar JSON", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await confirmJsonSaveIfNeeded();
  await page.getByLabel("JSON estructurado").fill(JSON.stringify({
    experiences: [{
      role: "Delivery Manager",
      company: "Demo Company",
      description: "Mantener detalle de experiencia",
      responsibilities: ["Coordinar UAT"]
    }],
    projects: [{
      name: "Portfolio Platform",
      description: "Mantener detalle de proyecto"
    }]
  }, null, 2));
  await page.getByLabel("Experiencia CV").fill("Delivery Manager - Demo Company - 2027");
  await page.getByRole("button", { name: "Aplicar experiencia", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Mantener detalle de experiencia/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Coordinar UAT/);
  await expect(page.getByLabel("Descripcion experiencia")).toHaveValue("Mantener detalle de experiencia");
  await expect(page.getByLabel("Responsabilidades experiencia")).toHaveValue("Coordinar UAT");
  await expect(page.getByLabel("Responsabilidad experiencia 1")).toHaveValue("Coordinar UAT");
  await page.getByRole("button", { name: "Añadir responsabilidad experiencia" }).click();
  await page.getByLabel("Responsabilidad experiencia 2").fill("Validar KPIs");
  await page.getByRole("button", { name: "Subir responsabilidad 2" }).click();
  await expect(page.getByLabel("Responsabilidad experiencia 1")).toHaveValue("Validar KPIs");
  await page.getByRole("button", { name: "Añadir logro experiencia" }).click();
  await page.getByLabel("Logro experiencia 1").fill("UAT estabilizado");
  await page.getByRole("button", { name: "Duplicar logro 1" }).click();
  await page.getByLabel("Logro experiencia 2").fill("Reporting ejecutivo");
  await page.getByRole("button", { name: "Aplicar experiencia granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"achievements\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/UAT estabilizado/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Validar KPIs[\s\S]*Coordinar UAT/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Coordinar UAT/);
  await page.getByLabel("Proyectos CV").fill("Portfolio Platform");
  await page.getByRole("button", { name: "Aplicar proyectos" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Mantener detalle de proyecto/);
  await page.getByLabel("Tecnologias proyecto CV").fill("Next.js\nNestJS");
  await page.getByRole("button", { name: "Aplicar proyecto granular" }).click();
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/\"technologies\"/);
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/Next\.js[\s\S]*NestJS/);
  await page.getByLabel("JSON estructurado").fill("[]");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue("[]");
  await page.getByRole("button", { name: "Guardar JSON" }).click({ force: true });
  await expect(page.getByText("JSON estructurado debe ser un objeto raiz.")).toBeVisible();
  await page.getByLabel("JSON estructurado").fill(JSON.stringify({ summary: "x".repeat(700), skills: [] }, null, 2));
  await expect(page.getByLabel("JSON estructurado")).toHaveValue(/"summary"/);
  await page.getByRole("button", { name: "Guardar JSON" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Confirmar cambio grande" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Confirmar cambio grande" })).toBeHidden();
  const archiveAdaptedButton = page.getByRole("button", { name: "Archivar CV Adaptado" });
  await archiveAdaptedButton.scrollIntoViewIfNeeded();
  await archiveAdaptedButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Confirmar archivado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click({ force: true });

  await page.goto("/admin/cv/templates");
  await expect(page.getByRole("heading", { name: "Plantillas de CV" })).toBeVisible();
  await expect(page.getByLabel("JSON de configuracion")).toBeVisible();
  await expect(page.getByLabel("JSON de configuracion")).toHaveValue(/primaryColor/);
  await page.getByLabel("JSON de configuracion").fill("[]");
  await expect(page.getByLabel("JSON de configuracion")).toHaveValue("[]");
  await page.getByRole("button", { name: "Guardar config JSON" }).click({ force: true });
  await expect(page.getByText("Config de plantilla debe ser un objeto.")).toBeVisible();
  await page.getByLabel("Densidad").selectOption("compact");
  await page.getByLabel("Nombre").fill("Plantilla invalida");
  await page.getByLabel("Color principal").fill("teal");
  await page.getByRole("button", { name: "Crear plantilla" }).click();
  await expect(page.getByText("Color principal debe ser HEX (#RRGGBB).")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ATS-friendly" })).toBeVisible();
  await expect(page.getByLabel("Preview de ATS-friendly")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar ATS-friendly" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/cv/target-roles");
  await expect(page.getByRole("heading", { name: "Roles objetivo CV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery Manager" })).toBeVisible();
  await page.getByLabel("Nombre rol").fill("Cloud Delivery Manager");
  await page.getByLabel("Keywords rol").fill("cloud\naws\nuat");
  await page.getByRole("button", { name: "Crear rol objetivo" }).click();
  await expect(page.getByText("Rol objetivo creado: Cloud Delivery Manager.")).toBeVisible();
  await page.getByLabel("Nombre de Delivery Manager").fill("Delivery Manager Senior");
  await page.getByLabel("Keywords de Delivery Manager").fill("delivery\nuat\nreporting");
  await page.getByRole("button", { name: "Guardar rol" }).first().click();
  await expect(page.getByText("Rol objetivo actualizado: Delivery Manager Senior.")).toBeVisible();
  await page.getByRole("button", { name: "Archivar rol" }).first().click();
  await expect(page.getByText("Rol objetivo archivado: Delivery Manager.")).toBeVisible();

  await page.goto("/admin/cv/adapt");
  await expect(page.getByRole("heading", { name: "Adaptar CV" })).toBeVisible();
  await page.getByLabel("Rol objetivo guardado").selectOption("target-role-1");
  await expect(page.getByLabel("Puesto objetivo")).toHaveValue("Delivery Manager");
  await expect(page.getByLabel("Descripcion de oferta")).toHaveValue(/Keywords objetivo: delivery, uat, kpi\./);
  await page.getByLabel("Puesto objetivo").fill("Delivery Manager");
  await page.getByLabel("Descripcion de oferta").fill("Buscamos Delivery Manager con KPIs, UAT, stakeholders, reporting y gestion de cliente en entornos cloud.");
  const adaptRequestPromise = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/cv/adapt-to-role") || request.method() !== "POST") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    return data.targetRoleId === "target-role-1";
  });
  await page.getByRole("button", { name: "Proponer adaptacion" }).click();
  await adaptRequestPromise;
  await expect(page.getByText("Resumen orientado a Delivery Manager.")).toBeVisible();
  const acceptKpis = page.getByRole("checkbox", { name: "Aceptar skill KPIs" });
  await acceptKpis.click();
  await expect(acceptKpis).not.toBeChecked();
  const acceptSummary = page.getByRole("checkbox", { name: "Aceptar resumen" });
  await acceptSummary.click();
  await expect(acceptSummary).not.toBeChecked();
  const acceptDescriptionField = page.getByRole("checkbox", { name: "Aceptar campo descripcion de IT Project Manager - Demo Company" });
  await acceptDescriptionField.click();
  await expect(acceptDescriptionField).not.toBeChecked();
  const acceptTeamLeaderExperience = page.getByRole("checkbox", { name: "Aceptar experiencia Team Leader - Demo Company" });
  await acceptTeamLeaderExperience.click();
  await expect(acceptTeamLeaderExperience).not.toBeChecked();
  const createAdaptedVersionRequestPromise = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/cv-versions") || request.method() !== "POST") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    const structuredJson = data.structuredJson || {};
    const skillNames = structuredJson.skills?.map((skill: { name?: string }) => skill.name) || [];
    const experiences = structuredJson.experiences || [];
    const projectManagerExperience = experiences.find((experience: { role?: string }) => experience.role === "IT Project Manager");
    return !("summary" in structuredJson)
      && skillNames.includes("UAT")
      && !skillNames.includes("KPIs")
      && Boolean(projectManagerExperience)
      && !("description" in projectManagerExperience)
      && projectManagerExperience.responsibilities?.includes("Coordinar UAT")
      && !experiences.some((experience: { role?: string }) => experience.role === "Team Leader")
      && structuredJson.adaptationMeta?.rejectedBlocks?.includes("summary")
      && structuredJson.adaptationMeta?.rejectedSkills?.includes("KPIs")
      && structuredJson.adaptationMeta?.rejectedExperiences?.includes("Team Leader - Demo Company")
      && structuredJson.adaptationMeta?.rejectedExperienceFields?.includes("IT Project Manager - Demo Company.description")
      && structuredJson.adaptationMeta?.acceptedSkills?.includes("UAT");
  });
  await page.getByRole("button", { name: "Crear version borrador" }).click();
  await createAdaptedVersionRequestPromise;
  await expect(page.getByText(/Version borrador creada/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Comparar version" })).toHaveAttribute("href", /\/admin\/cv\/compare\?baseId=cv-base&adaptedId=cv-adapted-new/);
  await expect(page.getByRole("link", { name: "Editar version" })).toHaveAttribute("href", /\/admin\/cv\/versions\?versionId=cv-adapted-new/);
  await page.getByRole("link", { name: "Comparar version" }).click();
  await expect(page).toHaveURL(/\/admin\/cv\/compare\?baseId=cv-base&adaptedId=cv-adapted-new/);
  await expect(page.getByRole("heading", { name: "Comparar CV" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar version adaptada" }).click();
  await expect(page.getByText("Version adaptada publicada como CV principal.")).toBeVisible();
  await expect(page.getByText("Auditoria publicacion")).toBeVisible();
  await expect(page.getByText(/set_primary \| cv-adapted-new/)).toBeVisible();

  await page.goto("/admin/cv/compare");
  await expect(page.getByRole("heading", { name: "Comparar CV" })).toBeVisible();
  await page.getByRole("button", { name: "Comparar versiones" }).click();
  await expect(page.getByText("Palabras nuevas")).toBeVisible();
  await expect(page.getByText("Solo en adaptado").first()).toBeVisible();
  await expect(page.getByText("KPIs", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Editar JSON adaptado" }).click();
  await expect(page).toHaveURL(/\/admin\/cv\/versions\?versionId=cv-adapted/);
  await expect(page.locator("#structuredJsonVersion")).toHaveValue("cv-adapted");

  await page.goto("/admin/cv/editor");
  await expect(page.getByRole("heading", { name: "Editor de CV" })).toBeVisible();
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-page-size", "A4");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-renderer", "web-preview");
  const adminPageCount = await expectA4PreviewLayout(page);
  expect(adminPageCount).toBeGreaterThanOrEqual(2);
  await expect(page.getByLabel("Plantilla preview admin")).toHaveValue("ats-friendly");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-template", "ats-friendly");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-density", "compact");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-page-count", String(adminPageCount));
  await page.getByLabel("Plantilla preview admin").selectOption("");
  await expect(page.locator("[data-cv-preview='a4']").first()).toHaveAttribute("data-cv-template", "default");
  const adminContactTexts = await page.locator("[data-cv-section='contact'] [data-cv-contact-item='true']").allTextContents();
  expect(adminContactTexts.every((text) => text.trim().length > 0)).toBeTruthy();
  await expect(page.locator("[data-cv-section='experiences']")).toBeVisible();
  await expect(page.locator("[data-cv-section='formation']")).toContainText("Formación superior en desarrollo de aplicaciones.");
  await expect(page.locator("[data-cv-section='formation']")).toContainText("Certificación incluida en el CV actual.");
  await expect(page.locator("[data-cv-section='languages']")).toContainText("Inglés B1");
  await expect(page.locator("[data-cv-section='projects']")).toContainText("Portfolio Platform");
  await expect(page.getByRole("heading", { name: "Validacion ATS" })).toBeVisible();
  await page.getByRole("button", { name: "Generar reporte ATS" }).click();
  await expect(page.getByText("Score 88 - strong")).toBeVisible();
  await expect(page.getByText("KPIs", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Generar PDF ATS" }).click();
  await expect(page.getByText("PDF ATS generado.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Descargar ultimo ATS" })).toHaveAttribute("href", /\/api\/v1\/media\/media-ats-pdf\/download/);
  await page.getByLabel("Puesto ATS objetivo").fill("Cloud Delivery Manager");
  await page.getByLabel("Descripcion de oferta ATS").fill("Oferta para Delivery Manager con UAT, gobierno cloud, reporting ejecutivo, stakeholders y AWS.");
  const atsRoleReportRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/cv/cv-1/ats-role-report") || request.method() !== "POST") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    return data.targetRole === "Cloud Delivery Manager" && data.jobDescription.includes("AWS");
  });
  await page.getByRole("button", { name: "Comparar con oferta ATS" }).click();
  await atsRoleReportRequest;
  await expect(page.getByText("Match oferta")).toBeVisible();
  await expect(page.getByText("67")).toBeVisible();
  await expect(page.getByText("aws", { exact: true })).toBeVisible();
  await expect(page.getByText(/existe en la experiencia real/)).toBeVisible();

  await page.goto("/admin/settings/users");
  await expect(page.getByRole("heading", { name: "Usuarios y permisos" })).toBeVisible();
  await expect(page.getByLabel("Buscar usuarios")).toBeVisible();
  await expect(page.getByText("Pagina 1 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Pagina siguiente usuarios" }).click();
  await expect(page.getByText("viewer4@example.com")).toBeVisible();
  await expect(page.getByText("Pagina 2 de 2")).toBeVisible();
  await page.getByLabel("Buscar usuarios").fill("editor");
  await expect(page.getByText("Pagina 1 de 1")).toBeVisible();
  await expect(page.getByText("editor@example.com")).toBeVisible();
  await page.getByLabel("Nombre de editor@example.com").fill("Editor Actualizado");
  await page.getByLabel("Password nueva de editor@example.com").fill("Password123");
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByText("Datos actualizados para editor@example.com.")).toBeVisible();
  await expect(page.getByLabel("Password nueva de editor@example.com")).toHaveValue("");
  await page.getByRole("button", { name: "Baja" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar baja" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/settings");
  await expect(page.getByText("Seguridad admin")).toBeVisible();
  await expect(page.getByText("Webhooks contacto")).toBeVisible();
  await expect(page.getByText("Validacion guiada de secreto")).toBeVisible();
  await expect(page.getByText("Rotacion guiada")).toBeVisible();
  await expect(page.getByText("pendiente de validacion")).toBeVisible();
  await page.getByLabel("Secreto candidato").fill("secret-value");
  const webhookSecretValidationRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/contact-messages/webhook/secret/validate") || request.method() !== "POST") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    return data.secret === "secret-value";
  });
  await page.getByRole("button", { name: "Validar secreto" }).click();
  await webhookSecretValidationRequest;
  await expect(page.getByText("Secreto webhook validado correctamente.")).toBeVisible();
  await expect(page.getByLabel("Secreto candidato")).toHaveValue("");
  await expect(page.getByText("nuevo valor validado")).toBeVisible();
  await expect(page.getByText("Ultima validacion: correcta")).toBeVisible();
  await expect(page.getByText("Ultimas entregas webhook")).toBeVisible();
  await expect(page.getByText("Reintentos: 2 cada 30000 ms")).toBeVisible();
  await expect(page.getByText("contact.message.created", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/retry 1/)).toBeVisible();
  await expect(page.getByText("HTTP 202")).toBeVisible();
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByText("Reintento enviado para message-2.")).toBeVisible();
  await expect(page.getByText("Cuenta sincronizada")).toBeVisible();
  await expect(page.getByText("OAuth configurado")).toBeVisible();
  await expect(page.getByText("GET /api/v1/integrations/linkedin/callback")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar setup" }).click();
  await expect(page.getByText("QR local")).toBeVisible();
  await expect(page.getByAltText("QR local para configurar MFA")).toBeVisible();

  await page.goto("/admin/settings/modules");
  await expect(page.getByRole("heading", { name: "Modulos de la plataforma" })).toBeVisible();
  await expect(page.locator("nav a[href='/admin/media']")).toHaveCount(0);
  await expect(page.getByText("Media", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Activar", exact: true }).click();
  await expect(page.getByText("Estado del modulo actualizado.")).toBeVisible();
  await expect(page.locator("nav a[href='/admin/media']")).toHaveCount(1);

  await page.goto("/admin/settings/translations");
  await expect(page.getByRole("heading", { name: "Traducciones editables" })).toBeVisible();
  await expect(page.getByText("Claves esperadas")).toBeVisible();
  await expect(page.getByText("Cubiertas CMS")).toBeVisible();
  await expect(page.getByText("Pendientes", { exact: true })).toBeVisible();
  await expect(page.getByText("downloadCv")).toBeVisible();

  await page.goto("/admin/media");
  await expect(page.getByRole("heading", { name: "Biblioteca media" })).toBeVisible();
  await expect(page.getByText("cuota 250 MB")).toBeVisible();
  await expect(page.getByText("scan on")).toBeVisible();
  await expect(page.getByText("assets 1")).toBeVisible();
  await expect(page.getByText("uso 2 KB")).toBeVisible();
  await expect(page.getByText("CV Demo.pdf")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar CV Demo.pdf" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/messages");
  await expect(page.getByRole("heading", { name: "Mensajes de contacto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "CSV API" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar filtrados leidos" })).toBeVisible();
  await page.getByRole("button", { name: "Marcar filtrados leidos" }).click();
  await expect(page.getByText("1 mensajes marcados como leidos.")).toBeVisible();
  await expect(page.getByLabel("Desde")).toBeVisible();
  await expect(page.getByLabel("Hasta")).toBeVisible();
  await expect(page.getByText("Oferta PM")).toBeVisible();
  await page.getByRole("button", { name: "Borrar mensaje de Recruiter Demo" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Detalle" }).click();
  await expect(page.getByRole("link", { name: "Responder email" })).toHaveAttribute("href", /mailto:recruiter%40example\.com/);

  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { name: "Analitica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
  await expect(page.getByRole("button", { name: "CSV API" })).toBeVisible();
  await expect(page.getByLabel("Desde")).toBeVisible();
  await expect(page.getByLabel("Hasta")).toBeVisible();
  await expect(page.getByLabel("Tipo de evento")).toBeVisible();
  await expect(page.getByText("Embudo conversion")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Landing -> CV -> Contacto" })).toBeVisible();
  await expect(page.getByText("25% desde landing")).toBeVisible();
  await page.getByLabel("Embudo", { exact: true }).selectOption("landing_visit,project_view,contact_submit");
  await expect(page.getByRole("heading", { name: "Landing -> Proyecto -> Contacto" })).toBeVisible();
  await expect(page.getByText("Vistas proyecto")).toBeVisible();
  await expect(page.getByText("50% desde landing")).toBeVisible();
  await expect(page.getByText("Embudo por canal")).toBeVisible();
  await expect(page.getByText("linkedin / social")).toBeVisible();
  await expect(page.getByText("4 - 40%")).toBeVisible();
  await expect(page.getByText("Tendencias", { exact: true })).toBeVisible();
  await expect(page.getByText("Privacidad analytics")).toBeVisible();
  await expect(page.getByText("retencion 30 dias")).toBeVisible();
  await page.getByRole("button", { name: "Purgar retencion" }).click();
  await expect(page.getByText("Retencion aplicada: 2 eventos purgados.")).toBeVisible();
  await expect(page.getByText("Serie diaria")).toBeVisible();
  await expect(page.getByText("Fuentes y canales")).toBeVisible();
  await expect(page.getByText("linkedin", { exact: true })).toBeVisible();
  await expect(page.getByText("social", { exact: true })).toBeVisible();
  await expect(page.getByText("Roles objetivo CV")).toBeVisible();
  await expect(page.getByText("Delivery Manager").first()).toBeVisible();
  await expect(page.getByText("Contextos")).toBeVisible();
  await expect(page.getByText("/cv/adapt-to-role?baseCvVersionId=cv-base&targetRoleId=target-role-1")).toBeVisible();
  await expect(page.getByText("Versiones base")).toBeVisible();
  await expect(page.getByText("base=cv-base | role=target-role-1 | company=false")).toBeVisible();
  await expect(page.getByText("2026-06-06").first()).toBeVisible();
  await expect(page.getByText("landing_visit").first()).toBeVisible();
  await page.getByLabel("Tipo de evento").selectOption("cv_download");
  await expect(page.getByText("cv_download").first()).toBeVisible();
  await expect(page.getByText("1 eventos").first()).toBeVisible();
});
