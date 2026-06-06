import { expect, test } from "@playwright/test";

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
  await expect(page.getByText("/cv/templates/minimalista")).toBeVisible();
  await expect(page.getByRole("link", { name: "Todas las plantillas" })).toHaveAttribute("href", "/cv/templates");
  await expect(page.getByRole("link", { name: "Descargar CV" })).toHaveAttribute("href", /\/api\/v1\/cv\/download\?template=minimalista$/);

  await page.goto("/en/cv/templates/ats-friendly");
  await expect(page.getByRole("heading", { name: "ATS-friendly" })).toBeVisible();
  await expect(page.getByText("A4 preview")).toBeVisible();
  await expect(page.getByText("/en/cv/templates/ats-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "All templates" })).toHaveAttribute("href", "/en/cv/templates");
  await expect(page.getByRole("link", { name: "Download resume" })).toHaveAttribute("href", /\/api\/v1\/cv\/download\?template=ats-friendly$/);
});

test("admin publication page is reachable behind the session proxy", async ({ context, page }) => {
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
  await page.route("**/api/v1/contact-messages/webhook/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        configured: true,
        hasSecret: true,
        event: "contact.message.created",
        testEvent: "contact.webhook.test",
        timeoutMs: 5000
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
        }
      ])
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
        { id: "cv-base", cvId: "cv-1", name: "CV Base", status: "published", language: "es", isPrimary: true, updatedAt: "2026-06-01T08:00:00.000Z" },
        { id: "cv-adapted", cvId: "cv-1", name: "CV Adaptado", status: "draft", language: "es", isPrimary: false, updatedAt: "2026-06-02T08:00:00.000Z" }
      ])
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
          experiences: [{ role: "IT Project Manager", company: "Demo Company" }],
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
  await page.route(/\/api\/v1\/analytics\/funnel(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        steps: [
          { key: "landing_visit", label: "Visitas landing", count: 20, rateFromStart: 100, rateFromPrevious: 100 },
          { key: "cv_download", label: "Descargas CV", count: 5, rateFromStart: 25, rateFromPrevious: 25 },
          { key: "contact_submit", label: "Formularios contacto", count: 2, rateFromStart: 10, rateFromPrevious: 40 }
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
          ]
        },
        latestChanges: [],
        modules: [
          { id: "module-1", key: "dashboard", name: "Dashboard", enabled: true, order: 1 },
          { id: "module-2", key: "analytics", name: "Analitica", enabled: true, order: 2 },
          { id: "module-3", key: "media", name: "Media", enabled: false, order: 3 }
        ]
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
          order: 0
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
        order: data.order ?? 0
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
          visible: true
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
        visible: data.visible ?? true
      })
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
          visible: true
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
        visible: data.visible ?? true
      })
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
          visible: true
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
        visible: data.visible ?? true
      })
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
          technologies: [],
          methodologies: [],
          skills: [],
          order: 0,
          visible: true,
          featured: true
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
  await expect(page.getByRole("link", { name: /Visitas landing/ })).toBeVisible();
  await expect(page.getByText("Pulso operativo")).toBeVisible();
  await expect(page.getByText("Segmentacion operativa")).toBeVisible();
  await expect(page.getByText("Cohorts mensuales")).toBeVisible();
  await expect(page.getByText("2026-06")).toBeVisible();
  await expect(page.getByText("cv_download")).toBeVisible();
  await expect(page.getByText("Conversion contacto")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ver eventos/ })).toHaveAttribute("href", "/admin/analytics");

  await page.goto("/admin/settings/publication");
  await expect(page.getByRole("heading", { name: "Revision de publicacion" })).toBeVisible();
  await expect(page.getByText("Draft / Publish")).toBeVisible();

  await page.goto("/admin/portfolio");
  await expect(page.getByRole("heading", { name: "Perfil publico" })).toBeVisible();

  await page.goto("/admin/portfolio/theme");
  await expect(page.getByText("Editor visual de estilos")).toBeVisible();
  await expect(page.getByText("Contraste y accesibilidad")).toBeVisible();
  await expect(page.getByText("Texto / fondo")).toBeVisible();

  await page.goto("/admin/portfolio/experience");
  await expect(page.getByRole("heading", { name: "Experiencia profesional" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Demo Company")).toBeVisible();
  await page.getByRole("button", { name: "Editar Demo Company" }).click();
  await expect(page.getByRole("heading", { name: "Editar experiencia" })).toBeVisible();
  await page.getByLabel("Empresa experiencia").fill("Demo Company Updated");
  await page.getByLabel("Cargo experiencia").fill("Delivery Manager");
  await page.getByLabel("Descripcion experiencia").fill("Experiencia ampliada en delivery y reporting.");
  await page.getByLabel("technologies experiencia").fill("Next.js\nNestJS");
  await page.getByRole("button", { name: "Guardar experiencia" }).click();
  await expect(page.getByText("Experiencia actualizada: Demo Company Updated.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Demo Company" })).toBeVisible();
  await page.getByRole("button", { name: "Subir Demo Company" }).click();
  await expect(page.getByText("Experiencia reordenada: Demo Company.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Demo Company" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/projects");
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
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
  await page.getByRole("button", { name: "Guardar proyecto" }).click();
  await expect(page.getByText("Proyecto actualizado: Portfolio Platform Pro.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Portfolio Platform" })).toBeVisible();
  await page.getByRole("button", { name: "Subir Portfolio Platform" }).click();
  await expect(page.getByText("Proyecto reordenado: Portfolio Platform.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Portfolio Platform" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/skills");
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
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
  await page.getByRole("button", { name: "Guardar skill" }).click();
  await expect(page.getByText("Skill actualizada: Scrum avanzado.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/education");
  await expect(page.getByRole("heading", { name: "Estudios" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Project Management")).toBeVisible();
  await page.getByRole("button", { name: "Editar Project Management" }).click();
  await expect(page.getByRole("heading", { name: "Editar estudio" })).toBeVisible();
  await page.getByLabel("Titulo estudio").fill("Project Management avanzado");
  await page.getByLabel("Institucion estudio").fill("Demo Institute");
  await page.getByLabel("Fecha estudio").fill("2026");
  await page.getByLabel("Descripcion estudio").fill("Programa ampliado de gestion.");
  await page.getByRole("button", { name: "Guardar estudio" }).click();
  await expect(page.getByText("Estudio actualizado: Project Management avanzado.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Project Management" })).toBeVisible();
  await page.getByRole("button", { name: "Subir Project Management" }).click();
  await expect(page.getByText("Estudio reordenado: Project Management.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Project Management" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/certifications");
  await expect(page.getByRole("heading", { name: "Certificaciones" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Scrum Master")).toBeVisible();
  await page.getByRole("button", { name: "Editar Scrum Master" }).click();
  await expect(page.getByRole("heading", { name: "Editar certificacion" })).toBeVisible();
  await page.getByLabel("Titulo certificacion").fill("Scrum Master avanzado");
  await page.getByLabel("Institucion certificacion").fill("Demo Academy");
  await page.getByLabel("Fecha certificacion").fill("2026");
  await page.getByLabel("Descripcion certificacion").fill("Certificacion ampliada de agilidad.");
  await page.getByRole("button", { name: "Guardar certificacion" }).click();
  await expect(page.getByText("Certificacion actualizada: Scrum Master avanzado.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bajar Scrum Master" })).toBeVisible();
  await page.getByRole("button", { name: "Subir Scrum Master" }).click();
  await expect(page.getByText("Certificacion reordenada: Scrum Master.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum Master" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/cv/versions");
  await expect(page.getByRole("heading", { name: "Versiones de CV" })).toBeVisible();
  await expect(page.getByLabel("Plantilla", { exact: true })).toBeVisible();
  await expect(page.getByLabel("JSON estructurado")).toBeVisible();
  await expect(page.locator("#structuredJsonVersion")).toHaveValue("cv-base");
  await page.getByLabel("JSON estructurado").fill("[]");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue("[]");
  await page.getByRole("button", { name: "Guardar JSON" }).click({ force: true });
  await expect(page.getByText("JSON estructurado debe ser un objeto raiz.")).toBeVisible();
  await page.getByLabel("JSON estructurado").fill(JSON.stringify({ summary: "x".repeat(300), skills: [] }, null, 2));
  await page.getByRole("button", { name: "Guardar JSON" }).click({ force: true });
  await expect(page.getByRole("heading", { name: "Confirmar cambio grande" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Confirmar cambio grande" })).toBeHidden();
  await page.getByRole("button", { name: "Archivar CV Adaptado" }).click({ force: true });
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

  await page.goto("/admin/cv/adapt");
  await expect(page.getByRole("heading", { name: "Adaptar CV" })).toBeVisible();
  await page.getByLabel("Puesto objetivo").fill("Delivery Manager");
  await page.getByLabel("Descripcion de oferta").fill("Buscamos Delivery Manager con KPIs, UAT, stakeholders, reporting y gestion de cliente en entornos cloud.");
  await page.getByRole("button", { name: "Proponer adaptacion" }).click();
  await expect(page.getByText("Resumen orientado a Delivery Manager.")).toBeVisible();
  await page.getByRole("button", { name: "Crear version borrador" }).click();
  await expect(page.getByText(/Version borrador creada/)).toBeVisible();

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
  await expect(page.getByText("Ultimas entregas webhook")).toBeVisible();
  await expect(page.getByText("contact.message.created", { exact: true })).toBeVisible();
  await expect(page.getByText("HTTP 202")).toBeVisible();
  await expect(page.getByText("GET /api/v1/integrations/linkedin/callback")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar setup" }).click();
  await expect(page.getByText("QR local")).toBeVisible();
  await expect(page.getByAltText("QR local para configurar MFA")).toBeVisible();

  await page.goto("/admin/settings/modules");
  await expect(page.getByRole("heading", { name: "Modulos de la plataforma" })).toBeVisible();

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
  await expect(page.getByLabel("Desde")).toBeVisible();
  await expect(page.getByLabel("Hasta")).toBeVisible();
  await expect(page.getByLabel("Tipo de evento")).toBeVisible();
  await expect(page.getByText("Embudo conversion")).toBeVisible();
  await expect(page.getByText("Landing a CV y contacto")).toBeVisible();
  await expect(page.getByText("25% desde landing")).toBeVisible();
  await expect(page.getByText("Tendencias", { exact: true })).toBeVisible();
  await expect(page.getByText("Privacidad analytics")).toBeVisible();
  await expect(page.getByText("retencion 30 dias")).toBeVisible();
  await page.getByRole("button", { name: "Purgar retencion" }).click();
  await expect(page.getByText("Retencion aplicada: 2 eventos purgados.")).toBeVisible();
  await expect(page.getByText("Serie diaria")).toBeVisible();
  await expect(page.getByText("Fuentes y canales")).toBeVisible();
  await expect(page.getByText("linkedin")).toBeVisible();
  await expect(page.getByText("social")).toBeVisible();
  await expect(page.getByText("2026-06-06").first()).toBeVisible();
  await expect(page.getByText("landing_visit").first()).toBeVisible();
  await page.getByLabel("Tipo de evento").selectOption("cv_download");
  await expect(page.getByText("cv_download").first()).toBeVisible();
  await expect(page.getByText("1 eventos").first()).toBeVisible();
});
