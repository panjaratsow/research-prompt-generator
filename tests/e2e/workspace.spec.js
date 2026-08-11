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

async function completePromptFields(page) {
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Postpartum haemorrhage");
  await page.getByLabel("Population and setting").fill("Women giving birth in Thai referral hospitals");
  await page.getByLabel("Question type").selectOption("prognosis");
  await page.getByLabel("Primary outcome").fill("Severe postpartum haemorrhage");
  await page.getByLabel("Research question *", { exact: true }).fill("Which modifiable factors predict severe postpartum haemorrhage?");
}

async function openPromptDrawer(page) {
  await completePromptFields(page);
  await page.getByRole("button", { name: "Generate prompt" }).click();
  await expect(page.getByRole("dialog", { name: "Generated research prompt" })).toBeVisible();
}

test("renders the approved hybrid workspace", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const facultyEmblem = page.getByRole("img", {
    name: "ตราคณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ / Faculty of Medicine, Srinakharinwirot University",
  });
  await expect(facultyEmblem).toBeVisible();
  await expect(facultyEmblem).toHaveAttribute("src", "./assets/faculty-medicine-swu-emblem.png");
  await expect(page.getByText("คณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Research Prompt Studio", level: 1 })).toHaveCount(1);
  await expect(page.getByTestId("setup-bar")).toBeVisible();
  await expect(page.getByTestId("lifecycle-rail")).toBeVisible();
  await expect(page.getByTestId("adaptive-form")).toBeVisible();
  await expect(page.getByTestId("standards-summary")).toContainText("STROBE");
});

test("approved seven-step lifecycle renders translated labels, tasks, and adaptive fields", async ({ page }) => {
  await page.goto("/");
  const stages = [
    {
      id: "define-question",
      thaiLabel: "ขั้นที่ 1: กำหนดคำถามวิจัย",
      englishLabel: "Step 1: Define the Research Question",
      task: "Define a focused, significant, and feasible research question.",
      fieldId: "topic",
    },
    {
      id: "literature-review",
      thaiLabel: "ขั้นที่ 2: ทบทวนวรรณกรรม",
      englishLabel: "Step 2: Conduct a Literature Review",
      task: "Plan and conduct a reproducible, critical review of relevant literature.",
      fieldId: "informationSources",
    },
    {
      id: "synthesize-information",
      thaiLabel: "ขั้นที่ 3: สังเคราะห์ข้อมูล",
      englishLabel: "Step 3: Synthesize Information",
      task: "Critically synthesize source-supported information, limitations, and certainty.",
      fieldId: "evidenceCertainty",
    },
    {
      id: "identify-gaps",
      thaiLabel: "ขั้นที่ 4: ระบุช่องว่างการวิจัย",
      englishLabel: "Step 4: Identify Research Gaps",
      task: "Identify and justify research gaps from the reviewed and synthesized information.",
      fieldId: "gapType",
    },
    {
      id: "generate-hypotheses",
      thaiLabel: "ขั้นที่ 5: สร้างสมมติฐาน",
      englishLabel: "Step 5: Generate Hypotheses",
      task: "Generate testable hypotheses, research propositions, or a justified non-hypothesis approach.",
      fieldId: "hypothesisApproach",
    },
    {
      id: "outline-methodology",
      thaiLabel: "ขั้นที่ 6: วางโครงร่างระเบียบวิธีวิจัย",
      englishLabel: "Step 6: Outline Research Methodology",
      task: "Outline a rigorous, feasible, ethical, and design-appropriate research methodology.",
      fieldId: "confirmedDesign",
    },
    {
      id: "write-proposal",
      thaiLabel: "ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย",
      englishLabel: "Step 7: Write a Research Proposal",
      task: "Integrate the research question, evidence, gaps, hypotheses, and methodology into a research proposal.",
      fieldId: "proposalType",
    },
  ];
  const buttons = page.locator('[data-action="stage"]');
  await expect(buttons).toHaveCount(7);
  expect(await buttons.evaluateAll(nodes => nodes.map(node => node.dataset.stageId))).toEqual(stages.map(stage => stage.id));
  for (const [index, stage] of stages.entries()) {
    await expect(buttons.nth(index)).toContainText(stage.thaiLabel);
  }

  await page.getByTestId("interface-language").selectOption("en");
  for (const [index, stage] of stages.entries()) {
    const button = buttons.nth(index);
    await expect(button).toContainText(stage.englishLabel);
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "step");
    await expect(page.locator(".form-description")).toHaveText(stage.task);
    await expect(page.locator(`[data-field-id="${stage.fieldId}"]`).first()).toBeVisible();
  }
});

test("Research profile starts collapsed outside the compact setup", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");

  await expect(page.getByTestId("setup-bar").getByLabel("Researcher role")).toHaveCount(0);
  await expect(page.getByTestId("setup-bar").locator("select, input")).toHaveCount(5);
  await page.getByRole("button", { name: "Research profile" }).click();
  await expect(page.getByLabel("Researcher role")).toBeVisible();
  await expect(page.getByLabel("Experience level")).toBeVisible();
  await expect(page.getByLabel("Scientific field")).toBeVisible();
  await expect(page.getByLabel("Country and institutional setting")).toBeVisible();
  await expect(page.getByLabel("Citation style")).toBeVisible();
});

test("Simple and Advanced fields use the compact accessible form", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");

  const simple = page.getByTestId("simple-fields");
  await expect(simple.locator("[data-field-id]")).toHaveCount(4);
  await expect(page.getByLabel("Question type")).toHaveRole("combobox");
  await expect(page.getByRole("button", { name: "Advanced details" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("advanced-fields")).toBeHidden();
});

test("Simple and Advanced form carries inherited context in canonical order", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Postpartum haemorrhage");
  await page.getByLabel("Population and setting").fill("Women in referral hospitals");
  await page.getByLabel("Primary outcome").fill("Severe haemorrhage");
  await page.locator('[data-draft-id="researchQuestion"]').fill("Which factors predict severe haemorrhage?");
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();

  const context = page.getByTestId("context-strip");
  expect(await context.locator("[data-context-field]").evaluateAll(items => items.map(item => item.dataset.contextField))).toEqual([
    "topic", "population", "researchQuestion", "primaryOutcome",
  ]);
  await expect(context.getByRole("button", { name: "Edit Research topic" })).toBeVisible();
  await expect(context.getByRole("button", { name: "Edit Population and setting" })).toBeVisible();
  await expect(context.getByRole("button", { name: "Edit Research question" })).toBeVisible();
  await expect(context.getByRole("button", { name: "Edit Primary outcome" })).toBeVisible();
});

test("Other reveals one labelled short input", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");

  await page.getByLabel("Question type").selectOption("other");
  const other = page.getByLabel("Other - specify");
  await expect(other).toBeVisible();
  await expect(other).toHaveAttribute("data-other-for", "questionType");
  await expect(page.locator('[data-other-for="questionType"]')).toHaveCount(1);
});

test("Not sure is offered only when the catalogue permits it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.locator('[data-action="stage"][data-stage-id="synthesize-information"]').click();
  await expect(page.getByLabel("Synthesis method").getByRole("option", { name: "Not sure - ask AI to recommend" })).toHaveCount(1);

  await page.locator('[data-action="stage"][data-stage-id="write-proposal"]').click();
  await page.getByRole("button", { name: "Advanced details" }).click();
  await expect(page.getByLabel("Registration").getByRole("option", { name: "Not sure - ask AI to recommend" })).toHaveCount(0);
});

test("checkbox chips expose checked state and customized drafts offer Restore suggested text", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
  const medline = page.getByRole("checkbox", { name: "MEDLINE/PubMed" });
  await medline.check();
  await expect(medline).toBeChecked();

  await page.locator('[data-action="stage"][data-stage-id="define-question"]').click();
  await page.locator('[data-draft-id="researchQuestion"]').fill("A user-customized research question.");
  await expect(page.getByRole("button", { name: "Restore suggested text" })).toBeVisible();
});

test("target-output selector enables every deliverable and maps it directly to its stage", async ({ page }) => {
  const stageOutputs = [
    ["define-question", "research-question"],
    ["literature-review", "literature-review-strategy"],
    ["synthesize-information", "evidence-synthesis"],
    ["identify-gaps", "research-gap-analysis"],
    ["generate-hypotheses", "hypotheses-propositions"],
    ["outline-methodology", "methodology-outline"],
    ["write-proposal", "research-proposal"],
  ];

  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const selector = page.getByLabel("Target output");
  expect(await selector.locator("option").evaluateAll(options => options.filter(option => !option.disabled).map(option => option.value))).toEqual([
    "stage-appropriate-deliverable",
    ...stageOutputs.map(([, targetOutput]) => targetOutput),
  ]);
  for (const [stageId, targetOutput] of stageOutputs) {
    await selector.selectOption(targetOutput);
    await expect(selector).toHaveValue(targetOutput);
    await expect(page.locator(`[data-action="stage"][data-stage-id="${stageId}"]`)).toHaveAttribute("aria-current", "step");
  }
});

test("Target output navigation preserves carry-forward context", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Cardiac remodelling");

  await page.getByLabel("Target output").selectOption("evidence-synthesis");
  await expect(page.locator('[data-action="stage"][data-stage-id="synthesize-information"]'))
    .toHaveAttribute("aria-current", "step");

  await page.locator('[data-action="stage"][data-stage-id="define-question"]').click();
  await expect(page.getByLabel("Research topic")).toHaveValue("Cardiac remodelling");
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
  await expect(page.getByTestId("inherited-context")).toContainText("Cardiac remodelling");
});

test("keyboard adaptive controls preserve native checkbox behavior", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");

  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
  const medline = page.getByRole("checkbox", { name: "MEDLINE/PubMed" });
  await medline.focus();
  await page.keyboard.press("Space");
  await expect(medline).toBeChecked();
  await expect(medline).toBeFocused();
});

test("disclosure toggles retain focus after click and keyboard open and close", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const advanced = page.getByRole("button", { name: "Advanced details" });
  await advanced.click();
  await expect(advanced).toHaveAttribute("aria-expanded", "true");
  await expect(advanced).toBeFocused();
  await advanced.click();
  await expect(advanced).toHaveAttribute("aria-expanded", "false");
  await expect(advanced).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(advanced).toHaveAttribute("aria-expanded", "true");
  await expect(advanced).toBeFocused();
  await page.keyboard.press("Space");
  await expect(advanced).toHaveAttribute("aria-expanded", "false");
  await expect(advanced).toBeFocused();

  const profile = page.getByRole("button", { name: "Research profile" });
  await profile.click();
  await expect(profile).toHaveAttribute("aria-expanded", "true");
  await expect(profile).toBeFocused();
  await profile.click();
  await expect(profile).toHaveAttribute("aria-expanded", "false");
  await expect(profile).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(profile).toHaveAttribute("aria-expanded", "true");
  await expect(profile).toBeFocused();
  await page.keyboard.press("Space");
  await expect(profile).toHaveAttribute("aria-expanded", "false");
  await expect(profile).toBeFocused();
});

test("Edit context returns to the canonical source control with focus", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research topic").fill("Cardiac remodelling");
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();

  await page.getByRole("button", { name: "Edit Research topic" }).click();
  await expect(page.locator('[data-action="stage"][data-stage-id="define-question"]')).toHaveAttribute("aria-current", "step");
  await expect(page.getByLabel("Research topic")).toBeFocused();
});

test("Other confirmation restores the old choice on Escape and clears only custom text on confirm", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const questionType = page.getByLabel("Question type");
  await questionType.selectOption("other");
  const other = page.getByLabel("Other - specify");
  await other.fill("Mechanistic question");

  await questionType.selectOption("prognosis");
  await expect(page.getByRole("dialog")).toContainText("Question type");
  await expect(page.getByRole("dialog")).not.toContainText("Mechanistic question");
  await page.keyboard.press("Escape");
  await expect(questionType).toHaveValue("other");
  await expect(questionType).toBeFocused();
  await expect(page.getByLabel("Other - specify")).toHaveValue("Mechanistic question");

  await questionType.selectOption("prognosis");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(questionType).toHaveValue("prognosis");
  await expect(page.getByLabel("Other - specify")).toHaveCount(0);
});

test("checkbox Other cancellation restores its trigger and confirmation preserves unrelated custom text", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  const questionType = page.getByLabel("Question type");
  await questionType.selectOption("other");
  await page.getByLabel("Other - specify").fill("Mechanistic question");

  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
  const medline = page.getByRole("checkbox", { name: "MEDLINE/PubMed" });
  const otherSource = page.locator('input[type="checkbox"][data-field-id="informationSources"][value="other"]');
  await medline.check();
  await otherSource.check();
  await page.locator('[data-other-for="informationSources"]').fill("Cochrane Library");

  await otherSource.uncheck();
  await expect(page.getByRole("dialog")).toContainText("Information sources");
  await page.keyboard.press("Escape");
  await expect(otherSource).toBeChecked();
  await expect(otherSource).toBeFocused();
  await expect(page.locator('[data-other-for="informationSources"]')).toHaveValue("Cochrane Library");

  await otherSource.uncheck();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(otherSource).not.toBeChecked();
  await expect(medline).toBeChecked();
  await expect(page.locator('[data-other-for="informationSources"]')).toHaveCount(0);

  await page.locator('[data-action="stage"][data-stage-id="define-question"]').click();
  await expect(questionType).toHaveValue("other");
  await expect(page.getByLabel("Other - specify")).toHaveValue("Mechanistic question");
});

test("a profile text edit publishes once when it blurs", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByRole("button", { name: "Research profile" }).click();
  await page.evaluate(() => {
    window.profileTextActions = [];
    window.addEventListener("workspace:statechange", event => window.profileTextActions.push(event.detail.action));
  });

  await page.getByLabel("Scientific field").fill("Maternal-fetal medicine");
  await page.getByLabel("Researcher role").focus();

  await expect.poll(() => page.evaluate(() => window.profileTextActions)).toEqual(["set-setup-field"]);
});

test("hidden Advanced incompatibility confirmation localizes field labels", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research type").selectOption("prediction");
  await page.getByLabel("Study subtype or design").selectOption("prediction-external-validation");
  await page.evaluate(() => window.__TEST_ONLY__.setFieldValue("externalValidation", "Plan external validation"));

  await page.getByLabel("Study subtype or design").selectOption("prediction-development");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("External validation");
  await expect(dialog).not.toContainText("externalValidation");
  await expect(dialog).not.toContainText("Plan external validation");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Study subtype or design")).toHaveValue("prediction-external-validation");
  await expect(page.getByLabel("Study subtype or design")).toBeFocused();
});

test("uploaded synthesis deidentifies, includes, copies, and downloads the searchable-PDF SOURCE block", async ({ page }) => {
  await page.addInitScript(() => {
    window.copiedPromptText = "";
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({ writeText: async text => { window.copiedPromptText = text; } }),
    });
  });
  await page.goto("/");
  await completePromptFields(page);
  await page.locator('[data-action="stage"][data-stage-id="synthesize-information"]').click();
  await page.getByLabel("Evidence summary").fill("Source summary");
  await page.getByLabel("Evidence pattern").selectOption("not-yet-assessed");
  await page.getByLabel("Synthesis method").selectOption("narrative");
  await page.getByLabel("Evidence certainty").selectOption("not-yet-assessed");
  await page.getByRole("checkbox", { name: "Sparse evidence" }).check();
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("Ready");
  await expect(page.getByLabel("Include S1")).toBeChecked();
  await page.getByRole("button", { name: "Generate prompt" }).click();
  const dialog = page.getByRole("dialog", { name: "Generated research prompt" });
  await expect(dialog).toContainText('<SOURCE id="S1" filename="searchable-evidence.pdf">');
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.locator("#appStatus")).toHaveText("Prompt copied.");
  await expect.poll(() => page.evaluate(() => window.copiedPromptText)).toContain('<SOURCE id="S1" filename="searchable-evidence.pdf">');
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download prompt" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^research-prompt-observational-synthesize-information-/);
});

test("preserves persistent setup and structured design across transitions", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByRole("button", { name: "Research profile" }).click();
  await page.getByLabel("Researcher role").selectOption("postgraduate-student");
  await page.getByLabel("Experience level").selectOption("advanced");
  await page.getByLabel("Scientific field").fill("Neonatology");
  await page.getByLabel("Country and institutional setting").fill("Thailand, university teaching hospital");
  await page.getByLabel("Citation style").selectOption("AMA");
  await page.locator('[data-action="stage"][data-stage-id="write-proposal"]').click();
  await page.getByLabel("Target output").selectOption("research-proposal");
  await page.getByLabel("Research type").selectOption("medical-education");
  await page.getByLabel("Study subtype or design").selectOption("education-observational");

  await expect(page.getByLabel("Researcher role")).toHaveValue("postgraduate-student");
  await expect(page.getByLabel("Experience level")).toHaveValue("advanced");
  await expect(page.getByLabel("Scientific field")).toHaveValue("Neonatology");
  await expect(page.getByLabel("Country and institutional setting")).toHaveValue("Thailand, university teaching hospital");
  await expect(page.getByLabel("Target output")).toHaveValue("research-proposal");
  await expect(page.getByLabel("Citation style")).toHaveValue("AMA");
  await expect(page.getByLabel("Study subtype or design")).toHaveValue("education-observational");
});

test("shows applicability-aware official standards links and review date", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research type").selectOption("evidence-review");
  await page.getByLabel("Study subtype or design").selectOption("systematic-review");
  await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();

  const standards = page.getByTestId("standards-summary");
  await expect(standards).toContainText("Reviewed 2026-08-01");
  await expect(standards).toContainText("PRISMA 2020");
  await expect(standards).not.toContainText("PRISMA-ScR");
  const officialLink = standards.getByRole("link", { name: /PRISMA 2020/i }).first();
  await expect(officialLink).toHaveAttribute("href", /^https:\/\//);

  await page.getByLabel("Study subtype or design").selectOption("scoping-review");
  await expect(standards).toContainText("PRISMA-ScR");
});

test("serves all local assets beneath the GitHub Pages path prefix", async ({ page }) => {
  const requestPaths = [];
  const failedResponses = [];
  const emblemResponses = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1") requestPaths.push(url.pathname);
  });
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.hostname === "127.0.0.1" && url.pathname === "/research-prompt-generator/assets/faculty-medicine-swu-emblem.png") {
      emblemResponses.push(response.status());
    }
    if (url.hostname === "127.0.0.1" && response.status() >= 400) {
      failedResponses.push(`${response.status()} ${url.pathname}`);
    }
  });

  await page.goto("/research-prompt-generator/");
  await expect(page.getByRole("heading", { name: "Research Prompt Studio" })).toBeVisible();
  await page.getByTestId("interface-language").selectOption("en");
  await page.evaluate(async () => {
    await Promise.all([
      fetch(document.querySelector("link[rel='manifest']").href),
      fetch(document.querySelector("link[rel='icon']").href),
    ]);
  });
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("Ready");

  expect(failedResponses).toEqual([]);
  expect(emblemResponses).toEqual([200]);
  expect(requestPaths).toEqual(expect.arrayContaining([
    "/research-prompt-generator/app.js",
    "/research-prompt-generator/assets/faculty-medicine-swu-emblem.png",
    "/research-prompt-generator/src/evidence/browser-adapters.js",
    "/research-prompt-generator/site.webmanifest",
    "/research-prompt-generator/favicon.svg",
    "/research-prompt-generator/vendor/mammoth.browser.min.js",
    "/research-prompt-generator/vendor/pdf.mjs",
    "/research-prompt-generator/vendor/pdf.worker.mjs",
  ]));
  expect(requestPaths.some(path => /^\/(?:vendor|src|favicon)/.test(path))).toBe(false);
});

test("copies, downloads, revokes the URL, and restores focus after Escape", async ({ page, browserName }) => {
  await page.addInitScript(() => {
    window.revokedPromptUrls = [];
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => {
      window.revokedPromptUrls.push(url);
      revoke(url);
    };
  });
  if (browserName === "chromium") {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  } else {
    await page.addInitScript(() => {
      window.copiedPromptText = "";
      Object.defineProperty(Navigator.prototype, "clipboard", {
        configurable: true,
        get: () => ({ writeText: async text => { window.copiedPromptText = text; } }),
      });
    });
  }
  await page.goto("/");
  await openPromptDrawer(page);
  await expect(page.getByTestId("prompt-output")).toContainText("CITATION AND TRACEABILITY");
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.locator("#appStatus")).toHaveText("Prompt copied.");
  await expect.poll(() => page.evaluate(async isChromium => (
    isChromium ? navigator.clipboard.readText() : window.copiedPromptText
  ), browserName === "chromium")).toContain("CITATION AND TRACEABILITY");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download prompt" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^research-prompt-observational-define-question-/);
  await expect.poll(() => page.evaluate(() => window.revokedPromptUrls.length)).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Generate prompt" })).toBeFocused();
});

test("selects prompt text and announces manual copying when clipboard writing fails", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({ writeText: async () => { throw new Error("clipboard denied"); } }),
    });
  });
  await page.goto("/");
  await openPromptDrawer(page);
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.locator("#appStatus")).toHaveText("Automatic copying is unavailable. The prompt text has been selected.");
  expect(await page.getByTestId("prompt-output").evaluate(output => output.selectionStart === 0 && output.selectionEnd === output.value.length)).toBe(true);
});

test("keeps a forced fallback dialog keyboard-modal and restores background interaction", async ({ page }) => {
  await page.addInitScript(() => { HTMLDialogElement.prototype.showModal = undefined; });
  await page.goto("/");
  await openPromptDrawer(page);
  await expect(page.locator("main")).toHaveJSProperty("inert", true);
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("prompt-output")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveJSProperty("inert", false);
  await expect(page.getByRole("button", { name: "Generate prompt" })).toBeFocused();
});

test("keeps the prompt drawer scroll-accessible without page overflow at a short mobile height", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 360 });
  await page.goto("/");
  await openPromptDrawer(page);
  const drawerMetrics = await page.getByRole("dialog").evaluate(drawer => ({
    fitsViewport: drawer.getBoundingClientRect().height <= window.innerHeight,
    scrollable: drawer.scrollHeight > drawer.clientHeight,
  }));
  expect(drawerMetrics).toEqual({ fitsViewport: true, scrollable: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("confirms reset and keeps prompt output language independent from interface language", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Output language").selectOption("thai");
  await page.getByLabel("Research topic").fill("Postpartum haemorrhage");
  await page.getByLabel("Population and setting").fill("Women giving birth in Thai referral hospitals");
  await page.getByLabel("Question type").selectOption("prognosis");
  await page.getByLabel("Primary outcome").fill("Severe postpartum haemorrhage");
  await page.getByLabel("Research question *", { exact: true }).fill("Which modifiable factors predict severe postpartum haemorrhage?");
  await page.getByRole("button", { name: "Generate prompt" }).click();
  await expect(page.getByTestId("prompt-output")).toContainText("Output language: Thai");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Start a new workspace" }).click();
  await expect(page.getByRole("dialog", { name: "Start a new workspace?" })).toBeVisible();
  await page.getByRole("button", { name: "Start new workspace" }).click();
  await expect(page.getByLabel(/หัวข้อวิจัย/i)).toHaveValue("");
});

test("keeps the workspace regions visible without horizontal page overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/");
  await expect(page.getByTestId("setup-bar")).toBeVisible();
  await expect(page.getByTestId("lifecycle-rail")).toBeVisible();
  await expect(page.getByTestId("adaptive-form")).toBeVisible();
  await expect(page.getByTestId("standards-summary")).toBeVisible();
  const geometry = await page.evaluate(() => {
    const bounds = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { right: rect.right, bottom: rect.bottom, top: rect.top, width: rect.width, height: rect.height };
    };
    return {
      viewportWidth: window.innerWidth,
      header: bounds(".app-header"),
      brand: bounds(".brand-lockup"),
      emblem: bounds(".brand-emblem"),
      title: bounds(".brand-lockup h1"),
      subtitle: bounds(".brand-subtitle"),
      actions: bounds(".header-actions"),
    };
  });
  expect(geometry.emblem.height).toBeLessThanOrEqual(40.5);
  expect(geometry.emblem.width / geometry.emblem.height).toBeCloseTo(2.345, 2);
  expect(geometry.brand.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.actions.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.brand.bottom).toBeLessThanOrEqual(geometry.actions.top);
  expect(geometry.title.bottom).toBeLessThanOrEqual(geometry.subtitle.top);
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
  await page.getByLabel(/population and setting/i).fill("Adults in Bangkok");
  await page.getByLabel("Question type").selectOption("prognosis");
  const outcome = page.getByLabel("Primary outcome");
  await outcome.focus();
  await outcome.pressSequentially("Improved care");
  const questionStage = page.locator('[data-action="stage"][data-stage-id="define-question"]');
  await expect(questionStage).toHaveAttribute("aria-label", /Step 1: Define the Research Question: ready/i);
  await expect(outcome).toHaveValue("Improved care");
  await expect(outcome).toBeFocused();
  expect(await outcome.evaluate(input => input.selectionStart === input.value.length)).toBe(true);
});

test("resolves contextual warnings through visible compact stage controls", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Research type").selectOption("prediction");
  await page.getByLabel("Study subtype or design").selectOption("prediction-external-validation");
  await page.locator('[data-action="stage"][data-stage-id="outline-methodology"]').click();

  const warnings = page.getByTestId("preflight-warnings");
  await expect(warnings).toContainText("Consider ethics approval");
  await expect(page.getByLabel("Feasibility period")).toBeVisible();
  await page.getByLabel("Feasibility period").selectOption("13-24-months");
  await page.getByRole("button", { name: "Advanced details" }).click();
  const methodologyEthics = page.getByLabel("Ethics and governance");
  await expect(methodologyEthics).toBeVisible();
  await methodologyEthics.fill("Seek institutional review before recruitment.");
  await expect(warnings).not.toContainText("Consider ethics approval");

  await page.locator('[data-action="stage"][data-stage-id="write-proposal"]').click();
  await expect(page.getByLabel("Proposal timeline")).toBeVisible();
  await page.getByLabel("Proposal timeline").selectOption("24-months");
  await page.getByRole("button", { name: "Advanced details" }).click();

  const registration = page.getByLabel("Study registration");
  const dataSharing = page.getByLabel("Data sharing plan");
  const governance = page.getByLabel("Detailed governance");
  await expect(registration).toBeVisible();
  await expect(dataSharing).toBeVisible();
  await expect(governance).toBeVisible();
  await expect(warnings).toContainText("Consider study registration");
  await expect(warnings).toContainText("Consider a data-sharing plan");
  await expect(warnings).toContainText("Consider ethics approval");
  await registration.fill("Register prospectively before enrolment.");
  await expect(warnings).not.toContainText("Consider study registration");
  await dataSharing.fill("Use controlled access with a data-use agreement.");
  await expect(warnings).not.toContainText("Consider a data-sharing plan");
  await governance.fill("Document ethics, data protection, and oversight responsibilities.");
  await expect(warnings).not.toContainText("Consider ethics approval");

  const questionStage = page.locator('[data-action="stage"][data-stage-id="define-question"]');
  await expect(questionStage.locator("[data-stage-status]")).toBeVisible();
  await expect(questionStage.locator("img[data-stage-icon]")).toBeVisible();
});

test("focuses the first available upload or deidentification blocker", async ({ page }) => {
  await page.goto("/");
  await completePromptFields(page);
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByRole("button", { name: "Generate prompt" }).click();
  await expect(page.getByTestId("evidence-input")).toBeFocused();

  await page.getByTestId("evidence-input").setInputFiles("tests/fixtures/searchable-evidence.pdf");
  await page.getByRole("button", { name: "Generate prompt" }).click();
  await expect(page.getByLabel("I confirm these files are deidentified")).toBeFocused();
});

test("preserves Advanced values across disclosure and stage changes", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByRole("button", { name: "Advanced details" }).click();
  await page.getByLabel(/problem statement/i).fill("Delayed diagnosis");
  const evidenceStage = page.getByRole("button", { name: /conduct a literature review/i });
  await expect(evidenceStage).toHaveAttribute("data-action", "stage");
  await expect(evidenceStage).toHaveAttribute("data-stage-id", "literature-review");
  await evidenceStage.click();
  expect(pageErrors).toEqual([]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(evidenceStage).toHaveAttribute("aria-current", "step");

  const questionStage = page.getByRole("button", { name: /define the research question/i });
  await questionStage.click();
  await expect(page.getByLabel(/problem statement/i)).toHaveValue("Delayed diagnosis");
  await page.getByRole("button", { name: "Advanced details" }).click();
  await expect(page.getByLabel(/problem statement/i)).toBeHidden();
  await page.getByRole("button", { name: "Advanced details" }).click();
  await expect(page.getByLabel(/problem statement/i)).toHaveValue("Delayed diagnosis");
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
  await expect(page.locator("#appStatus")).toHaveText("Evidence processing finished: 1 ready sources, 0 sources with issues.");
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
  await expect(page.locator("#appStatus")).toHaveText("Extracting text from S1.");

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

test("removing an extracting source prevents its delayed result from returning", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await selectDelayedEvidence(page);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S1")).toContainText("Extracting text");

  await page.getByRole("button", { name: "Remove S1" }).click();
  await expect(page.getByTestId("source-S1")).toHaveCount(0);
  await releaseDelayedEvidence(page);

  await expect(page.getByTestId("source-S1")).toHaveCount(0);
});

test("changing and removing existing sources survives another delayed parse", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles([
    "tests/fixtures/searchable-evidence.pdf",
    "tests/fixtures/searchable-evidence.docx",
  ]);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S2")).toContainText("Ready");

  await selectDelayedEvidence(page);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);
  await expect(page.getByTestId("source-S3")).toContainText("Extracting text");
  await page.getByLabel("Include S1").uncheck();
  await page.getByRole("button", { name: "Remove S2" }).click();
  await releaseDelayedEvidence(page);

  await expect(page.getByLabel("Include S1")).not.toBeChecked();
  await expect(page.getByTestId("source-S1")).toContainText("searchable-evidence.pdf");
  await expect(page.getByTestId("source-S2")).toContainText("delayed-evidence.txt");
  await expect(page.getByTestId("source-S2")).toContainText("Ready");
  await expect(page.getByText("searchable-evidence.docx")).toHaveCount(0);
});

test("parses valid peers and inventories rejected files in a mixed batch", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.getByTestId("evidence-input").setInputFiles([
    { name: "evidence.csv", mimeType: "text/csv", buffer: Buffer.from("source,finding\nS1,Verified evidence source 2026\n") },
    { name: "legacy.doc", mimeType: "application/msword", buffer: Buffer.from("legacy") },
    { name: "unsupported.exe", mimeType: "application/octet-stream", buffer: Buffer.from("unsupported") },
  ]);
  await confirmDeidentified(page, "I confirm these files are deidentified");
  await processEvidence(page);

  await expect(page.getByTestId("source-S1")).toContainText("evidence.csv");
  await expect(page.getByTestId("source-S1")).toContainText("Ready");
  await expect(page.getByTestId("source-S2")).toHaveAttribute("data-error-code", "legacy-doc-unsupported");
  await expect(page.getByTestId("source-S3")).toHaveAttribute("data-error-code", "unsupported-file-type");
  await expect(page.getByRole("button", { name: "Remove S2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove S3" })).toBeVisible();
  expect(await page.evaluate(() => window.__TEST_ONLY__.sourceStorageMetadata())).toEqual([
    { id: "S1", status: "ready", hasFile: false },
    { id: "S2", status: "excluded", hasFile: false },
    { id: "S3", status: "excluded", hasFile: false },
  ]);
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
  await expect(source).not.toContainText("image-only-pdf");
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
  await expect(page.getByTestId("preflight-blocking")).toContainText("S1 (25,001 characters)");
  await expect(page.getByTestId("source-S1")).toContainText("Type: TXT");
  await expect(page.getByTestId("source-S1")).toContainText("Size: 24.4 KB");
  await expect(page.getByTestId("source-S1")).toContainText("Extracted characters: 25,001");
  await expect(page.getByTestId("source-S1")).toContainText("Budget contribution: 25,001 characters");
});

test("publishes source metadata without internal keys or evidence text", async ({ page }) => {
  const secret = "private-event-evidence";
  await page.goto("/");
  await page.getByTestId("interface-language").selectOption("en");
  await page.getByLabel("Evidence mode").selectOption("uploaded");
  await page.evaluate(() => {
    window.publicWorkspaceEvents = [];
    window.addEventListener("workspace:statechange", event => window.publicWorkspaceEvents.push(event.detail));
  });
  await page.evaluate(value => window.__TEST_ONLY__.loadSyntheticEvidence(value), secret);

  const eventState = await page.evaluate(() => window.publicWorkspaceEvents.at(-1).state);
  expect(eventState.sources[0]).toMatchObject({ id: "S1", status: "ready", extractedCharacters: secret.length });
  expect(eventState.sources[0]).not.toHaveProperty("text");
  expect(eventState.sources[0]).not.toHaveProperty("_key");
  expect(eventState.sources[0]).not.toHaveProperty("file");
  expect(JSON.stringify(eventState)).not.toContain(secret);
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
