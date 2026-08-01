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

test("keeps field focus and complete text while typing", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const topic = page.getByLabel(/research topic/i);
  await topic.focus();
  await topic.pressSequentially("postpartum care");
  await expect(topic).toHaveValue("postpartum care");
  await expect(topic).toBeFocused();
  expect(await topic.evaluate(input => input.selectionStart === input.value.length)).toBe(true);
});

test("updates question readiness while the final required field remains focused", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel(/research topic/i).fill("Postpartum care");
  await page.getByLabel(/study population/i).fill("Adults in Bangkok");
  const question = page.locator('[data-field-id="researchQuestion"] textarea');
  await question.focus();
  await question.pressSequentially("Which factors improve care?");
  const questionStage = page.locator('[data-action="stage"][data-stage-id="question"]');
  await expect(questionStage).toHaveAttribute("aria-label", /Research question: ready/i);
  await expect(question).toHaveValue("Which factors improve care?");
  await expect(question).toBeFocused();
  expect(await question.evaluate(input => input.selectionStart === input.value.length)).toBe(true);
});

test("confirms incompatible stage changes and supports modal keyboard controls", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.evaluate(() => {
    window.workspaceStates = [];
    window.addEventListener("workspace:statechange", event => window.workspaceStates.push(event.detail.state));
  });
  await page.getByLabel(/problem statement/i).fill("Delayed diagnosis");
  expect(await page.evaluate(() => window.workspaceStates.at(-1).fields.problemStatement)).toBe("Delayed diagnosis");
  const evidenceStage = page.getByRole("button", { name: /evidence/i });
  await expect(evidenceStage).toHaveAttribute("data-action", "stage");
  await expect(evidenceStage).toHaveAttribute("data-stage-id", "evidence");
  await evidenceStage.click();
  expect(pageErrors).toEqual([]);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Problem statement");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Confirm change" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(evidenceStage).not.toHaveAttribute("aria-current", "step");
  await expect(page.getByLabel(/problem statement/i)).toHaveValue("Delayed diagnosis");
  await expect(evidenceStage).toBeFocused();
  await evidenceStage.click();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Confirm change" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(evidenceStage).toHaveAttribute("aria-current", "step");
  await expect(page.getByLabel(/problem statement/i)).toHaveCount(0);
});

test("localizes document language and resolves the uploaded-mode confirmation blocker", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await page.getByTestId("interface-language").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByTestId("interface-language").selectOption("th");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await page.getByLabel(/โหมดหลักฐาน/i).selectOption("uploaded");
  await expect(page.getByLabel(/ยืนยันการลบข้อมูลระบุตัวตน/i)).toBeVisible();
  await expect(page.getByTestId("validation-summary")).toContainText("เพิ่มหลักฐานที่พร้อมใช้งาน");
  await page.getByLabel(/ยืนยันการลบข้อมูลระบุตัวตน/i).check();
  await expect(page.getByTestId("validation-summary")).not.toContainText("ยืนยันว่าลบข้อมูลระบุตัวตนแล้ว");
  await page.getByRole("button", { name: /เริ่มพื้นที่ทำงานใหม่/i }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
});
