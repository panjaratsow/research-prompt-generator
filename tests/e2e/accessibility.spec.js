import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function openPromptDrawer(page) {
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Postpartum haemorrhage");
  await page.getByLabel("Population and setting").fill("Women giving birth in Thai referral hospitals");
  await page.getByLabel("Research question *", { exact: true }).fill("Which modifiable factors predict severe postpartum haemorrhage?");
  await page.getByRole("button", { name: "Generate prompt" }).click();
  await expect(page.getByRole("dialog", { name: "Generated research prompt" })).toBeVisible();
}

test("has no automatically detectable WCAG A or AA violations in localized page and drawer states", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
  const pageResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(pageResults.violations).toEqual([]);
  await openPromptDrawer(page);
  const drawerResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(drawerResults.violations).toEqual([]);
});
