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
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Visitas landing")).toBeVisible();

  await page.goto("/admin/settings/publication");
  await expect(page.getByRole("heading", { name: "Revision de publicacion" })).toBeVisible();
  await expect(page.getByText("Draft / Publish")).toBeVisible();

  await page.goto("/admin/portfolio");
  await expect(page.getByRole("heading", { name: "Perfil publico" })).toBeVisible();

  await page.goto("/admin/settings/users");
  await expect(page.getByRole("heading", { name: "Usuarios y permisos" })).toBeVisible();

  await page.goto("/admin/settings");
  await expect(page.getByText("Seguridad admin")).toBeVisible();
  await expect(page.getByText("Webhooks contacto")).toBeVisible();

  await page.goto("/admin/messages");
  await expect(page.getByRole("heading", { name: "Mensajes de contacto" })).toBeVisible();

  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { name: "Analitica" })).toBeVisible();
});
