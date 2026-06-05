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
