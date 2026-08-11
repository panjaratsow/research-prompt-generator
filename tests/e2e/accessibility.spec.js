import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(results.violations).toEqual([]);
}

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
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: /ข้อมูลผู้วิจัย/i }).click();
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
  await page.locator('[data-action="toggle-advanced"]').click();
  const otherSource = page.locator('input[type="checkbox"][data-field-id="informationSources"][value="other"]');
  await otherSource.check();
  await page.locator('[data-other-for]').fill("ThaiJO");
  await expectNoAxeViolations(page);

  await page.getByTestId("interface-language").selectOption("en");
  await expect(page.getByRole("button", { name: "Research profile" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Advanced details" })).toHaveAttribute("aria-expanded", "true");
  const sources = page.getByRole("group", { name: /Information sources/ });
  await expect(sources.getByRole("checkbox", { name: "Other - specify" })).toBeChecked();
  await expect(page.locator('[data-other-for="informationSources"]')).toHaveValue("ThaiJO");
  await expectNoAxeViolations(page);

  await page.locator('[data-action="stage"][data-stage-id="define-question"]').click();
  await openPromptDrawer(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectNoAxeViolations(page);
});
