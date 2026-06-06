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
  await page.route("**/api/v1/cv-versions", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "cv-base", name: "CV Base", status: "published", language: "es", isPrimary: true, updatedAt: "2026-06-01T08:00:00.000Z" },
        { id: "cv-adapted", name: "CV Adaptado", status: "draft", language: "es", isPrimary: false, updatedAt: "2026-06-02T08:00:00.000Z" }
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

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Visitas landing")).toBeVisible();
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

  await page.goto("/admin/portfolio/projects");
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();

  await page.goto("/admin/portfolio/skills");
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();

  await page.goto("/admin/portfolio/education");
  await expect(page.getByRole("heading", { name: "Estudios" })).toBeVisible();

  await page.goto("/admin/portfolio/certifications");
  await expect(page.getByRole("heading", { name: "Certificaciones" })).toBeVisible();

  await page.goto("/admin/cv/versions");
  await expect(page.getByRole("heading", { name: "Versiones de CV" })).toBeVisible();
  await expect(page.getByLabel("Plantilla")).toBeVisible();
  await expect(page.getByLabel("JSON estructurado")).toBeVisible();

  await page.goto("/admin/cv/templates");
  await expect(page.getByRole("heading", { name: "Plantillas de CV" })).toBeVisible();

  await page.goto("/admin/cv/adapt");
  await expect(page.getByRole("heading", { name: "Adaptar CV" })).toBeVisible();

  await page.goto("/admin/cv/compare");
  await expect(page.getByRole("heading", { name: "Comparar CV" })).toBeVisible();
  await page.getByRole("button", { name: "Comparar versiones" }).click();
  await expect(page.getByText("Solo en adaptado").first()).toBeVisible();
  await expect(page.getByText("KPIs", { exact: true })).toBeVisible();

  await page.goto("/admin/cv/editor");
  await expect(page.getByRole("heading", { name: "Editor de CV" })).toBeVisible();

  await page.goto("/admin/settings/users");
  await expect(page.getByRole("heading", { name: "Usuarios y permisos" })).toBeVisible();
  await expect(page.getByLabel("Buscar usuarios")).toBeVisible();
  await page.getByLabel("Buscar usuarios").fill("editor");
  await expect(page.getByText("editor@example.com")).toBeVisible();
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
  await page.getByRole("button", { name: "Detalle" }).click();
  await expect(page.getByRole("link", { name: "Responder email" })).toHaveAttribute("href", /mailto:recruiter%40example\.com/);

  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { name: "Analitica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
  await expect(page.getByLabel("Desde")).toBeVisible();
  await expect(page.getByLabel("Hasta")).toBeVisible();
});
