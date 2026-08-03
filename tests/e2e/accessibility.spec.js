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
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  const thaiPageResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(thaiPageResults.violations).toEqual([]);
  await openPromptDrawer(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishDrawerResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(englishDrawerResults.violations).toEqual([]);
});
