import { expect, test } from "@playwright/test";

test("landing intro, hero and command palette work", async ({ page }) => {
  await page.goto("/");
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

  await page.goto("/en/cv/templates");
  await expect(page.getByRole("heading", { name: "Resume templates" })).toBeVisible();
  await expect(page.getByText("ATS-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "View resume online" })).toHaveAttribute("href", "/en/cv");
});

test("public CV template detail previews are shareable", async ({ page }) => {
  await page.goto("/cv/templates/minimalista");
  await expect(page.getByRole("heading", { name: "Minimalista" })).toBeVisible();
  await expect(page.getByText("Preview A4")).toBeVisible();
  await expect(page.getByText("/cv/templates/minimalista")).toBeVisible();
  await expect(page.getByRole("link", { name: "Todas las plantillas" })).toHaveAttribute("href", "/cv/templates");

  await page.goto("/en/cv/templates/ats-friendly");
  await expect(page.getByRole("heading", { name: "ATS-friendly" })).toBeVisible();
  await expect(page.getByText("A4 preview")).toBeVisible();
  await expect(page.getByText("/en/cv/templates/ats-friendly")).toBeVisible();
  await expect(page.getByRole("link", { name: "All templates" })).toHaveAttribute("href", "/en/cv/templates");
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
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "cv-base", name: "CV Base", status: "published", language: "es", isPrimary: true, updatedAt: "2026-06-01T08:00:00.000Z" },
        { id: "cv-adapted", name: "CV Adaptado", status: "draft", language: "es", isPrimary: false, updatedAt: "2026-06-02T08:00:00.000Z" }
      ])
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
  await page.route(/\/api\/v1\/analytics(\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "event-1", type: "landing_visit", path: "/", label: "Landing", createdAt: "2026-06-06T08:00:00.000Z" },
        { id: "event-2", type: "landing_visit", path: "/", label: "Landing", createdAt: "2026-06-06T09:00:00.000Z" },
        { id: "event-3", type: "cv_download", path: "/cv", label: "CV", createdAt: "2026-06-05T09:00:00.000Z" }
      ])
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
  await page.route("**/api/v1/projects/project-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "project-1",
        name: "Portfolio Platform",
        slug: "portfolio-platform",
        description: "Proyecto demo",
        status: "archived",
        categoryName: "Portfolio",
        technologies: ["Next.js", "NestJS"],
        featured: true,
        visible: false,
        sample: false,
        order: 0
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

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Visitas landing")).toBeVisible();
  await expect(page.getByText("Pulso operativo")).toBeVisible();
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
  await page.getByRole("button", { name: "Eliminar Demo Company" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/projects");
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Portfolio Platform")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Portfolio Platform" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/skills");
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Scrum")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/education");
  await expect(page.getByRole("heading", { name: "Estudios" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Project Management")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Project Management" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/portfolio/certifications");
  await expect(page.getByRole("heading", { name: "Certificaciones" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Scrum Master")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Scrum Master" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/cv/versions");
  await expect(page.getByRole("heading", { name: "Versiones de CV" })).toBeVisible();
  await expect(page.getByLabel("Plantilla")).toBeVisible();
  await expect(page.getByLabel("JSON estructurado")).toBeVisible();
  await expect(page.locator("#structuredJsonVersion")).toHaveValue("cv-base");
  await page.getByLabel("JSON estructurado").fill("[]");
  await expect(page.getByLabel("JSON estructurado")).toHaveValue("[]");
  await page.getByRole("button", { name: "Guardar JSON" }).click({ force: true });
  await expect(page.getByText("JSON estructurado debe ser un objeto raiz.")).toBeVisible();
  await page.getByRole("button", { name: "Archivar CV Adaptado" }).click({ force: true });
  await expect(page.getByRole("heading", { name: "Confirmar archivado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click({ force: true });

  await page.goto("/admin/cv/templates");
  await expect(page.getByRole("heading", { name: "Plantillas de CV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ATS-friendly" })).toBeVisible();
  await page.getByRole("button", { name: "Eliminar ATS-friendly" }).click();
  await expect(page.getByRole("heading", { name: "Confirmar borrado" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/admin/cv/adapt");
  await expect(page.getByRole("heading", { name: "Adaptar CV" })).toBeVisible();

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
  await page.getByRole("button", { name: "Iniciar setup" }).click();
  await expect(page.getByText("QR local")).toBeVisible();
  await expect(page.getByAltText("QR local para configurar MFA")).toBeVisible();

  await page.goto("/admin/settings/modules");
  await expect(page.getByRole("heading", { name: "Modulos de la plataforma" })).toBeVisible();

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
  await expect(page.getByText("Tendencias", { exact: true })).toBeVisible();
  await expect(page.getByText("landing_visit").first()).toBeVisible();
});
