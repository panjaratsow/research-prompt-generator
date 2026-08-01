# Task 9 Implementation, Test, and Self-Review Report

## Scope Delivered

- Added `src/ui/prompt-drawer.js` with native `<dialog>` support and an accessible modal fallback.
- Added prompt generation, review metadata, readonly prompt output, icon-only Copy/Download/Close controls with accessible names and title tooltips, clipboard fallback, and dated text download creation.
- Added prompt preflight focus/announcement behavior, confirmation before resetting populated fields or in-memory sources, and prompt drawer state events without changing `buildPrompt(state)`, `validateState(state)`, localized `t()`, evidence cancellation, or `workspace:statechange`.
- Added polite-live-region announcements for evidence selection, extraction, processing outcomes, copying, downloading, reset, and prompt-preflight issues.
- Kept evidence memory-only and local; no network, persistence, account, or backend behavior was introduced.
- Added responsive containment so the lifecycle rail remains horizontally scrollable without producing document-level mobile overflow.

## Test-First Record

1. Added the required prompt review/export E2E regression to `tests/e2e/workspace.spec.js` and the WCAG A/AA Axe regression to `tests/e2e/accessibility.spec.js` before production edits.
2. Attempted the requested RED command:

   ```text
   npm run test:e2e -- --project=desktop-chromium --grep "generates|WCAG"
   ```

   It could not start because `npm` is unavailable in this environment. The failure was environment-level (`npm` is not recognized), not a product assertion failure, so the intended RED state could not be observed.
3. Added focused unit coverage for `copyPrompt` and `downloadPrompt` in `tests/unit/prompt-drawer.test.js`. Automated execution is blocked by the same missing Node/npm launcher.

## Verification Evidence

Automated commands attempted:

| Command | Result |
| --- | --- |
| `npm test` | Blocked: `npm` is not recognized. |
| `npm run test:e2e -- --project=desktop-chromium` | Blocked: `npm` is not recognized. |
| `npm run test:e2e -- --project=mobile-chromium` | Blocked: `npm` is not recognized. |
| Axe WCAG A/AA E2E regression | Added but blocked with the desktop Playwright command. |
| `git diff --check` | Passed. |

Manual local-browser checks against `http://127.0.0.1:4173/`:

- Generated the prompt from the Task 9 observational-question values; the dialog exposed `Generated research prompt`, readonly `prompt-output`, and `CITATION AND TRACEABILITY` content.
- Confirmed Copy is the first focused dialog control; dialog metadata includes character/token counts, selected evidence count, applicable standards, quality items, and four mandatory safeguards.
- Confirmed Download invokes the local download path and announces `Prompt downloaded.`. The in-app browser download-event hook did not report a download despite the UI action completing, so suggested-filename assertion remains pending automated Playwright execution.
- Confirmed both Close and Escape close the dialog and restore focus to `Generate prompt`.
- Confirmed reset opens a confirmation dialog after fields are populated and restores the Thai default state after confirmation.
- Confirmed a 412 px viewport has `documentElement.scrollWidth` of 397 px while the lifecycle rail remains internally horizontally scrollable.

## Self-Review

- Native and fallback prompt dialogs both close on Escape; close restores the trigger focus.
- Copy errors select the readonly prompt and use the polite status region without closing the dialog.
- Download uses a temporary appended anchor and revokes the blob URL after the click.
- Prompt-open/close operations publish `workspace:statechange`; evidence-operation generation cancellation remains unchanged.
- Source text is still never persisted or sent off-device; existing source deidentification flow is unchanged.
- No silent evidence truncation was introduced; the responsive containment applies only to document-level overflow while retaining the rail's own scroll access.

## Remaining Concern

This environment lacks an executable Node/npm launcher, so the required unit, desktop/mobile Playwright, and Axe suites could not run here. Run the listed npm commands in a Node 20.19+ environment before release.

## Verification Gap Resolution (2026-08-02)

The bundled Node runtime was supplied after the initial report. The following PowerShell environment setup was used for every command:

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH
$env:NODE_USE_SYSTEM_CA='1'
$env:npm_config_cache=(Join-Path $PWD '.npm-cache')
$node='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
```

Exact unit command and final result:

```powershell
& $node node_modules/vitest/vitest.mjs run
```

```text
Test Files  9 passed (9)
Tests  62 passed (62)
```

The first external-server readiness probe used `Get-NetTCPConnection`; it did not detect the owned listener, timed out, and did not run E2E. `netstat -ano` confirmed that the server was listening, so the owned process was stopped and the readiness probe was corrected to `netstat`. This was an environment-observation issue, not an application failure.

The first desktop run then exposed the prompt-action regression: Playwright's `toContainText` read an empty textarea text node even though the prompt was present in `.value`. The existing E2E regression failed as expected. The minimal production correction initializes both the readonly textarea value and text content with the generated prompt.

Exact final E2E server/test command:

```powershell
$server=Start-Process -FilePath $node -ArgumentList 'scripts/serve.mjs','--port','4173' -WorkingDirectory $PWD -WindowStyle Hidden -PassThru
$deadline=(Get-Date).AddSeconds(30)
while (-not (netstat -ano | Select-String '127\.0\.0\.1:4173\s+.*LISTENING')) { if ((Get-Date) -gt $deadline) { throw 'Timed out waiting for port 4173.' }; Start-Sleep -Milliseconds 250 }
& $node node_modules/@playwright/test/cli.js test --project=desktop-chromium --workers=1
& $node node_modules/@playwright/test/cli.js test --project=mobile-chromium --workers=1
```

The actual execution used `try`/`finally` to call `Stop-Process` for the owned server after the two projects completed.

Final results:

```text
desktop-chromium: 15 passed (12.4s)
mobile-chromium: 15 passed (12.8s)
```

Both projects include `tests/e2e/accessibility.spec.js`; the Axe WCAG 2.0/2.1 A/AA regression passed in each. Generated `test-results` output was removed after the run. The final `git diff --check` passed with no findings. The initial environment concern is resolved.

## Review Fix Round 1 (2026-08-02)

RED command:

```powershell
& $node node_modules/@playwright/test/cli.js test --project=desktop-chromium --workers=1 --grep 'forced fallback|short mobile'
```

Result: 2 failed as expected: fallback `main.inert` was `false`, and the drawer exceeded a 360px viewport.

GREEN commands:

```powershell
& $node node_modules/vitest/vitest.mjs run
& $node node_modules/@playwright/test/cli.js test --project=desktop-chromium --workers=1
& $node node_modules/@playwright/test/cli.js test --project=mobile-chromium --workers=1
```

Results: unit 9 files / 62 tests passed; desktop 19/19 passed; mobile 19/19 passed. Both browser projects ran Axe over the initial page and generated drawer states with WCAG A/AA tags. `git diff --check` passed and `test-results` was removed.
