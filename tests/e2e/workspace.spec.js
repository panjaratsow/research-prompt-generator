import { expect, test } from "@playwright/test";

test("renders the approved hybrid workspace", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await expect(page.getByRole("heading", { name: "Research Prompt Studio" })).toBeVisible();
  await expect(page.getByTestId("setup-bar")).toBeVisible();
  await expect(page.getByTestId("lifecycle-rail")).toBeVisible();
  await expect(page.getByTestId("adaptive-form")).toBeVisible();
  await expect(page.getByTestId("standards-summary")).toContainText("STROBE");
});

test("keeps the workspace regions visible without horizontal page overflow on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("setup-bar")).toBeVisible();
  await expect(page.getByTestId("lifecycle-rail")).toBeVisible();
  await expect(page.getByTestId("adaptive-form")).toBeVisible();
  await expect(page.getByTestId("standards-summary")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
