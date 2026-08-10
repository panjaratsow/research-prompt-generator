import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function openPromptDrawer(page) {
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Postpartum haemorrhage");
  await page.getByLabel("Population and setting").fill("Women giving birth in Thai referral hospitals");
  await page.getByLabel("Question type").selectOption("prognosis");
  await page.getByLabel("Primary outcome").fill("Severe postpartum haemorrhage");
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
  await page.getByRole("button", { name: /ข้อมูลผู้วิจัย/i }).click();
  const thaiProfileResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(thaiProfileResults.violations).toEqual([]);

  await page.getByTestId("interface-language").selectOption("en");
  await page.getByRole("button", { name: "Advanced details" }).click();
  const englishAdvancedResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(englishAdvancedResults.violations).toEqual([]);
  await page.getByLabel("Question type").selectOption("other");
  await expect(page.getByLabel("Other - specify")).toBeVisible();
  const englishOtherResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(englishOtherResults.violations).toEqual([]);

  await openPromptDrawer(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishDrawerResults = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(englishDrawerResults.violations).toEqual([]);
});
