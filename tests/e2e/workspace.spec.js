import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

async function confirmDeidentified(page, label) {
  const confirmation = page.getByLabel(label);
  await confirmation.focus();
  await page.keyboard.press("Space");
  await expect(confirmation).toBeChecked();
  await expect(confirmation).toBeAttached();
  await expect(confirmation).toBeFocused();
  await expect(page.locator("[data-action='evidence-process']")).toBeEnabled();
}

async function processEvidence(page) {
  const process = page.locator("[data-action='evidence-process']");
  await expect(process).toBeEnabled();
  expect(await process.evaluate(button => {
    const bounds = button.getBoundingClientRect();
    const target = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return target === button || button.contains(target);
  })).toBe(true);
  await process.focus();
  await page.keyboard.press("Enter");
}

async function selectDelayedEvidence(page) {
  await page.evaluate(() => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    window.delayedEvidence = { calls: 0, release, settled: false };
    const file = new File(["Delayed evidence"], "delayed-evidence.txt", { type: "text/plain" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => {
        window.delayedEvidence.calls += 1;
        await gate;
        setTimeout(() => { window.delayedEvidence.settled = true; }, 0);
        return new TextEncoder().encode("Delayed evidence source").buffer;
      },
    });
    document.querySelector("#evidenceWorkspaceRoot").dispatchEvent(new CustomEvent("evidence:add", {
      bubbles: true,
      detail: { files: [file] },
    }));
  });
}

async function releaseDelayedEvidence(page) {
  await page.evaluate(() => window.delayedEvidence.release());
  await page.waitForFunction(() => window.delayedEvidence.settled);
}

async function imageOnlyPdf() {
  const document = await PDFDocument.create();
  const page = document.addPage([100, 100]);
  const image = await document.embedPng(Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  ));
  page.drawImage(image, { x: 10, y: 10, width: 80, height: 80 });
  return Buffer.from(await document.save());
}

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
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await expect(page.getByLabel(/ไฟล์เหล่านี้ลบข้อมูลระบุตัวตนแล้ว/i)).toBeVisible();
  await expect(page.getByTestId("validation-summary")).toContainText("เพิ่มหลักฐานที่พร้อมใช้งาน");
  await confirmDeidentified(page, /ไฟล์เหล่านี้ลบข้อมูลระบุตัวตนแล้ว/i);
  await expect(page.getByTestId("validation-summary")).not.toContainText("ยืนยันว่าลบข้อมูลระบุตัวตนแล้ว");
  await expect(page.getByTestId("source-S1")).toHaveCount(0);
  await page.getByRole("button", { name: /เริ่มพื้นที่ทำงานใหม่/i }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
});

test("requires deidentification confirmation and parses uploaded evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await expect(page.getByTestId("privacy-confirmation")).toBeVisible();
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("searchable-evidence.pdf");
  await expect(page.getByTestId("source-S1")).toContainText("Ready");
});

test("clearing uploaded mode during parsing cannot restore stale evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.evaluate(() => {
    window.workspaceEvents = [];
    window.addEventListener("workspace:statechange", event => window.workspaceEvents.push(event.detail));
  });
  await selectDelayedEvidence(page);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("Extracting text");

  await page.getByLabel("Evidence mode").selectOption("planning");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Clear and change mode" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("source-S1")).toHaveCount(0);
  await releaseDelayedEvidence(page);

  await expect(page.getByTestId("source-S1")).toHaveCount(0);
  await expect(page.getByLabel("Evidence mode")).toHaveValue("planning");
  expect(await page.evaluate(() => window.workspaceEvents.at(-1).state.sources)).toEqual([]);
});

test("repeated Process activation cannot overlap or retain File records", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.evaluate(() => {
    window.workspaceEvents = [];
    window.addEventListener("workspace:statechange", event => window.workspaceEvents.push(event.detail));
  });
  await selectDelayedEvidence(page);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await page.locator("[data-action='evidence-process']").press("Enter");
  await expect.poll(() => page.evaluate(() => window.delayedEvidence.calls)).toBeGreaterThan(0);
  await releaseDelayedEvidence(page);
  await page.waitForFunction(() => window.workspaceEvents.some(event => event.action === "evidence-process"));

  expect(await page.evaluate(() => window.delayedEvidence.calls)).toBe(1);
  expect(await page.evaluate(() => {
    const finalEvent = window.workspaceEvents.filter(event => event.action === "evidence-process").at(-1);
    return finalEvent.state.sources.every(source => !("file" in source) && source.status !== "extracting");
  })).toBe(true);
});

test("a second file batch requires fresh deidentification confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("Ready");

  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.docx");
  await expect(page.getByLabel("I confirm these files are deidentified")).not.toBeChecked();
  await expect(page.locator("[data-action='evidence-process']")).toBeDisabled();
  await expect(page.getByTestId("validation-summary")).toContainText("Confirm that identifying information was removed");
});

test("an image-only PDF becomes an excluded error source", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles({
    name: "image-only.pdf",
    mimeType: "application/pdf",
    buffer: await imageOnlyPdf(),
  });
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);

  const source = page.getByTestId("source-S1");
  await expect(source).toHaveAttribute("data-error-code", "image-only-pdf");
  await expect(source).toContainText("PDF contains no searchable text; OCR is not supported");
  await expect(page.getByLabel("Include S1")).toBeDisabled();
  await expect(page.getByLabel("Include S1")).not.toBeChecked();
});

test("blocks an over-budget source without truncating it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByLabel("Evidence budget").selectOption("25000");
  await page.evaluate(() => window.__TEST_ONLY__?.loadSyntheticEvidence("x".repeat(25001)));
  await expect(page.getByTestId("preflight-blocking")).toContainText("exceeds the selected evidence budget");
});

test("wraps uploaded source rows without mobile overflow", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
