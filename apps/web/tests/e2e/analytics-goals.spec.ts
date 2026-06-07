import { expect, test } from "@playwright/test";

test("admin analytics KPI goals render and persist mutations", async ({ context, page }) => {
  await context.addCookies([{ name: "accessToken", value: "test-token", url: "http://localhost:3000" }]);

  await page.route("**/api/v1/app-modules?includeHidden=true", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/api/v1/analytics/summary**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ totalVisits: 10, cvDownloads: 2, contactSubmits: 1, projectViews: 4 })
    });
  });
  await page.route("**/api/v1/analytics/timeseries**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ date: "2026-06-07", total: 2, types: { cv_download: 2 } }])
    });
  });
  await page.route("**/api/v1/analytics/channels**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ sources: [{ name: "linkedin", count: 2 }], channels: [{ name: "social", count: 2 }] })
    });
  });
  await page.route("**/api/v1/analytics/labels**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ labels: [], paths: [], contexts: [] })
    });
  });
  await page.route(/\/api\/v1\/analytics\/funnel\/channels(?:\?.*)?$/, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ segments: [] }) });
  });
  await page.route(/\/api\/v1\/analytics\/funnel-definitions(?:\?.*)?$/, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route(/\/api\/v1\/analytics\/funnel(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        steps: [
          { key: "landing_visit", label: "Visitas landing", count: 10, rateFromStart: 100, rateFromPrevious: 100 },
          { key: "cv_download", label: "Descargas CV", count: 2, rateFromStart: 20, rateFromPrevious: 20 }
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
        ipHashSaltConfigured: true,
        retentionWorkerEnabled: true,
        retentionWorkerIntervalMs: 86400000
      })
    });
  });
  await page.route(/\/api\/v1\/analytics\/goals\/progress(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "goal-1",
          key: "sample-cv-downloads",
          name: "Descargas CV sample/demo",
          description: "Objetivo demo editable.",
          eventType: "cv_download",
          targetCount: 3,
          period: "monthly",
          visible: true,
          order: 0,
          count: 2,
          progressRate: 66.7,
          achieved: false,
          remainingCount: 1,
          alertLevel: "info",
          alertMessage: "Faltan 1 evento para cerrar el objetivo."
        }
      ])
    });
  });
  await page.route(/\/api\/v1\/analytics\/goals\/goal-1$/, async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "goal-1",
          key: "sample-cv-downloads",
          name: "Descargas CV revisadas",
          eventType: "cv_download",
          targetCount: 5,
          period: "monthly",
          visible: true,
          order: 0
        })
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "goal-1", visible: false })
    });
  });
  await page.route(/\/api\/v1\/analytics\/goals$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "goal-2",
        key: "contactos-mensuales",
        name: "Contactos mensuales",
        eventType: "contact_submit",
        targetCount: 2,
        period: "monthly",
        visible: true,
        order: 1
      })
    });
  });
  await page.route(/\/api\/v1\/analytics(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "event-1", type: "cv_download", path: "/cv", label: "CV", createdAt: "2026-06-07T08:00:00.000Z" }
      ])
    });
  });

  await page.goto("/admin/analytics");

  await expect(page.getByRole("heading", { name: "Analitica" })).toBeVisible();
  await expect(page.getByText("Objetivos KPI", { exact: true })).toBeVisible();
  await expect(page.getByText("Descargas CV sample/demo")).toBeVisible();
  await expect(page.getByText("meta 3 - 66,7%")).toBeVisible();
  await expect(page.getByText("Faltan 1 evento para cerrar el objetivo.")).toBeVisible();

  await page.getByRole("button", { name: /Descargas CV sample\/demo/ }).click();
  await expect(page.getByLabel("Nombre objetivo")).toHaveValue("Descargas CV sample/demo");
  await page.getByLabel("Nombre objetivo").fill("Descargas CV revisadas");
  await page.getByLabel("Meta").fill("5");
  const updateRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/analytics/goals/goal-1") || request.method() !== "PATCH") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    return data.name === "Descargas CV revisadas" && data.targetCount === 5;
  });
  await page.getByRole("button", { name: "Guardar objetivo KPI" }).click();
  await updateRequest;

  await page.getByRole("button", { name: "Nuevo objetivo KPI" }).click();
  await page.getByLabel("Nombre objetivo").fill("Contactos mensuales");
  await page.getByLabel("Meta").fill("2");
  await page.getByLabel("Evento", { exact: true }).selectOption("contact_submit");
  const createRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/v1/analytics/goals") || request.method() !== "POST") {
      return false;
    }
    const data = JSON.parse(request.postData() || "{}");
    return data.key === "contactos-mensuales" && data.eventType === "contact_submit";
  });
  await page.getByRole("button", { name: "Crear objetivo KPI" }).click();
  await createRequest;
});
