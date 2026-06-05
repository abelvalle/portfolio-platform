import { expect, test } from "@playwright/test";

test("landing intro, hero and command palette work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Abel Valle Rosa" }).first()).toBeVisible();
  await page.getByRole("button", { name: /Saltar intro|Entrar/ }).first().click();
  await expect(page.getByText("IT Project Manager | Delivery Manager").first()).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("option", { name: "Descargar CV" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Acceso secreto admin" })).toBeVisible();
});
