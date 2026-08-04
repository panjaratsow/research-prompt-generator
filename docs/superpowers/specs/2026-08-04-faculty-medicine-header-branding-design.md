# Faculty of Medicine Header Branding Design

Date: 2026-08-04
Status: Approved in conversation

## Objective

Replace the generic `R` mark in the Research Prompt Studio header with the official Faculty of Medicine, Srinakharinwirot University emblem. Preserve the application name and add a restrained faculty subtitle so the institutional owner is clear without making the operational workspace feel like a landing page.

## Brand Source

Use the unmodified Faculty of Medicine asset distributed through the university's official SWU Unity identity page:

`https://unity.swu.ac.th/logo-2/`

The asset must be copied into the static application. The deployed page must not depend on a third-party or runtime network request for the logo.

## Header Layout

- Replace `.brand-mark` and its `R` text with an image-based faculty emblem.
- Keep `Research Prompt Studio` as the primary heading.
- Add `คณะแพทยศาสตร์ มหาวิทยาลัยศรีนครินทรวิโรฒ` as a compact secondary line.
- Render the emblem at approximately 44 px on desktop and 38-40 px on narrow mobile screens.
- Preserve the existing language control, privacy message, reset button, header density, and responsive wrapping.
- Do not crop, recolor, distort, redraw, or generate the official emblem.

## Accessibility And Delivery

- Give the image a concise Thai/English accessible description.
- Preserve a single page-level `h1` for the application name.
- Keep sufficient contrast and stable dimensions so the header does not shift while the asset loads.
- Use a relative static asset path that works both locally and under the GitHub Pages repository prefix.
- If the asset fails to load, the application name and faculty subtitle remain visible and usable.

## Testing

- Add a browser assertion for the official emblem, its accessible name, and the faculty subtitle.
- Verify desktop and mobile layouts do not overflow or overlap header actions.
- Retain existing asset-path, accessibility, responsive, unit, and browser coverage.
- Release only after `git diff --check`, the unit suite, configured browser checks, and public GitHub Pages verification pass.

## Out Of Scope

- Changing the research workflow, prompt contract, colors, application name, or navigation.
- Adding a marketing hero, footer branding, external analytics, or runtime logo fetching.
- Altering the official faculty emblem.
