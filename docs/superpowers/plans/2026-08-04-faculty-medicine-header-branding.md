# Faculty of Medicine Header Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `R` header mark with official Faculty of Medicine, Srinakharinwirot University branding while preserving the compact responsive research workspace.

**Architecture:** Store one optimized official emblem as a local static asset and render it through semantic HTML in the existing brand lockup. Keep all layout behavior in `styles.css`; the application state, research workflow, prompt engine, and runtime data flow remain unchanged.

**Tech Stack:** Static HTML/CSS/ES modules, Pillow for lossless asset preparation when required, Vitest 4, Playwright 1.62, Axe, GitHub Pages.

## Global Constraints

- The official Faculty of Medicine asset must come from `https://unity.swu.ac.th/logo-2/` and must not be redrawn, recolored, distorted, or generated.
- Replace the existing `R` mark; do not add a second competing brand mark.
- Preserve `Research Prompt Studio` as the single page-level `h1`.
- Add the visible subtitle `คณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ`.
- Use the accessible image description `ตราคณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ / Faculty of Medicine, Srinakharinwirot University`.
- The asset must be local and must load beneath the GitHub Pages repository prefix without a runtime third-party request.
- The emblem must have stable dimensions of 44 px on desktop and 40 px at the existing narrow mobile breakpoint.
- Preserve the language control, privacy message, reset button, header density, static/local-only architecture, and all research behavior.
- A missing logo must not hide the application name or faculty subtitle.
- Design reference: `docs/superpowers/specs/2026-08-04-faculty-medicine-header-branding-design.md`.

---

## File Map

- Create: `assets/faculty-medicine-swu-emblem.png` - optimized local copy of the official emblem-only identity asset.
- Modify: `index.html` - semantic image, application title, and faculty subtitle.
- Modify: `styles.css` - stable desktop/mobile emblem and lockup dimensions.
- Modify: `tests/e2e/workspace.spec.js` - brand, path-prefix, responsive, and fallback-visible assertions.

### Task 1: Official Asset And Responsive Header

**Files:**
- Create: `assets/faculty-medicine-swu-emblem.png`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/e2e/workspace.spec.js`

**Interfaces:**
- Consumes: the official Faculty of Medicine identity package from SWU Unity and the existing `.brand-lockup` header contract.
- Produces: a static image at `./assets/faculty-medicine-swu-emblem.png`, `.brand-emblem`, `.brand-copy`, and `.brand-subtitle` rendered without application JavaScript.

- [ ] **Step 1: Add failing brand assertions**

Extend the existing `renders the approved hybrid workspace` scenario with:

```js
const facultyEmblem = page.getByRole("img", {
  name: "ตราคณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ / Faculty of Medicine, Srinakharinwirot University",
});
await expect(facultyEmblem).toBeVisible();
await expect(facultyEmblem).toHaveAttribute("src", "./assets/faculty-medicine-swu-emblem.png");
await expect(page.getByText("คณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ", { exact: true })).toBeVisible();
await expect(page.getByRole("heading", { name: "Research Prompt Studio", level: 1 })).toHaveCount(1);
```

In the GitHub Pages prefix scenario, assert the emblem request returns HTTP `200` beneath `/research-prompt-generator/assets/faculty-medicine-swu-emblem.png`.

- [ ] **Step 2: Run the focused browser tests and verify RED**

Run:

```powershell
$node = 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$env:PATH = "$(Split-Path $node);$env:PATH"
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved hybrid workspace|GitHub Pages path prefix"
```

Expected: FAIL because the official image, subtitle, and asset request do not exist.

- [ ] **Step 3: Acquire and prepare the official emblem**

Download package ID `506` from the SWU Unity Faculty of Medicine link. Select its official color emblem-only raster export. Preserve transparency and aspect ratio; do not crop identity elements from a wordmark or recreate the mark. Save the selected asset as:

```text
assets/faculty-medicine-swu-emblem.png
```

If the official raster is larger than 1600 px on either axis, downscale proportionally with Lanczos resampling to a 1600 px maximum. Do not upscale a smaller source. Verify the final PNG has nonzero dimensions and an alpha channel or clean white background.

- [ ] **Step 4: Replace the generic header mark**

Replace the existing one-line brand lockup in `index.html` with:

```html
<div class="brand-lockup">
  <img
    class="brand-emblem"
    src="./assets/faculty-medicine-swu-emblem.png"
    alt="ตราคณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ / Faculty of Medicine, Srinakharinwirot University"
    width="44"
    height="44"
  >
  <div class="brand-copy">
    <h1>Research Prompt Studio</h1>
    <p class="brand-subtitle">คณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ</p>
  </div>
</div>
```

The title and subtitle remain normal text, so both stay visible if the image fails.

- [ ] **Step 5: Add stable responsive branding styles**

Replace `.brand-mark` styles and extend the brand rules with:

```css
.brand-lockup { min-width:0; }
.brand-emblem { width:44px; height:44px; object-fit:contain; flex:0 0 44px; }
.brand-copy { min-width:0; }
.brand-lockup h1 { font-size:1.15rem; line-height:1.2; }
.brand-subtitle { margin-top:2px; color:var(--muted); font-size:.72rem; line-height:1.25; }
```

At `max-width:560px`, set `.brand-emblem` to `40px` square with `flex-basis:40px`, keep `.brand-copy` inside the viewport, and preserve the existing stacked header actions.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: both scenarios pass and the asset response is `200`.

- [ ] **Step 7: Add mobile geometry assertions**

In the existing responsive scenario, read the header, brand lockup, emblem, title, subtitle, and header-action bounding boxes in one `evaluate` call. Assert:

```js
expect(geometry.emblem.width).toBeLessThanOrEqual(40.5);
expect(geometry.brand.right).toBeLessThanOrEqual(geometry.viewportWidth);
expect(geometry.actions.right).toBeLessThanOrEqual(geometry.viewportWidth);
expect(geometry.brand.bottom).toBeLessThanOrEqual(geometry.actions.top);
expect(geometry.title.bottom).toBeLessThanOrEqual(geometry.subtitle.top);
```

- [ ] **Step 8: Run desktop/mobile and Axe verification**

Run:

```powershell
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved hybrid workspace|GitHub Pages path prefix|visible without horizontal page overflow|WCAG"
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=mobile-chromium --workers=1 --grep="approved hybrid workspace|visible without horizontal page overflow|WCAG"
```

Expected: all selected scenarios pass with no header overlap or Axe violation.

- [ ] **Step 9: Commit the branded header**

```powershell
git add assets/faculty-medicine-swu-emblem.png index.html styles.css tests/e2e/workspace.spec.js
git commit -m "feat: add faculty medicine header branding"
```

### Task 2: Verification And Publication

**Files:**
- Verify: `assets/faculty-medicine-swu-emblem.png`
- Verify: `index.html`
- Verify: `styles.css`
- Verify: `tests/e2e/workspace.spec.js`

**Interfaces:**
- Consumes: the completed static header and official local asset.
- Produces: a clean tested branch, fast-forwarded GitHub Pages deployment, and verified public header.

- [ ] **Step 1: Run complete local acceptance**

Run:

```powershell
& $node .superpowers\npm-cli\package\bin\npm-cli.js run vendor
& $node .superpowers\npm-cli\package\bin\npm-cli.js test -- --reporter=dot
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=desktop-chromium --workers=1
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=mobile-chromium --workers=1
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=desktop-firefox --workers=1
& $node .superpowers\npm-cli\package\bin\npm-cli.js run test:e2e -- --project=desktop-webkit --workers=1
git diff --check
git status --short
```

Expected: vendor has no tracked output, every unit/browser/Axe test passes, diff check exits `0`, and the worktree is clean. Run Firefox in the established permitted process context if the restricted Windows SWGL path times out.

- [ ] **Step 2: Clean owned verification artifacts**

Stop only the separately owned test-server PID. Resolve `test-results`, `playwright-report`, and `blob-report` to absolute paths, verify every path remains inside the isolated worktree, and remove only those generated directories. Confirm port `4173` has no listener.

- [ ] **Step 3: Verify ancestry and publish without force**

Run:

```powershell
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
git push origin codex/world-class-medical-research
git push origin HEAD:main
```

Expected: ancestry exits `0`; both pushes fast-forward.

- [ ] **Step 4: Verify the public GitHub Pages header**

Reload `https://panjaratsow.github.io/research-prompt-generator/` and verify:

- the official faculty emblem is visible and loads from the repository asset path;
- the accessible image description and faculty subtitle are present;
- `Research Prompt Studio` remains the only `h1`;
- desktop and mobile header content does not overlap;
- the seven-stage workspace and prompt generation still work;
- the browser console contains no errors.

Keep the verified public application tab open for the user.
