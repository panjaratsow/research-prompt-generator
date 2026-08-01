import { t } from "../i18n.js";

const drawerEntries = new WeakMap();

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { dataset, ...properties } = options;
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (key.includes("-")) node.setAttribute(key, value);
    else node[key] = value;
  }
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}

function createIconButton(action, label, icon) {
  return element("button", { type: "button", className: "icon-button", dataset: { action }, "aria-label": label, title: label }, [element("img", { src: `vendor/icons/${icon}`, alt: "" })]);
}

function drawerContent(prompt, locale, metadata) {
  const headingId = "promptDrawerTitle";
  const output = element("textarea", { id: "promptOutput", className: "prompt-output", readOnly: true, value: prompt, dataset: { testid: "prompt-output" } });
  const copy = createIconButton("prompt-copy", t(locale, "actions.copy"), "copy.svg");
  const download = createIconButton("prompt-download", t(locale, "actions.download"), "download.svg");
  const close = createIconButton("prompt-close", t(locale, "actions.close"), "x.svg");
  const standards = metadata.standards?.length
    ? metadata.standards.map(standard => element("li", { textContent: `${standard.name} (${standard.version})` }))
    : [element("li", { textContent: t(locale, "noStageStandard") })];
  const checklist = metadata.qualityChecklist?.map(item => element("li", { textContent: item })) ?? [];
  const safeguards = t(locale, "prompt.safeguardItems").map(item => element("li", { textContent: item }));
  return {
    copy,
    download,
    close,
    output,
    headingId,
    content: [
      element("div", { className: "prompt-drawer-heading" }, [
        element("div", {}, [element("div", { className: "panel-kicker", textContent: t(locale, "prompt.kicker") }), element("h2", { id: headingId, textContent: t(locale, "prompt.title") })]),
        element("div", { className: "prompt-drawer-actions" }, [copy, download, close]),
      ]),
      element("div", { className: "prompt-metrics", "aria-label": t(locale, "prompt.summary") }, [
        element("span", { textContent: t(locale, "prompt.characters", { value: prompt.length.toLocaleString() }) }),
        element("span", { textContent: t(locale, "prompt.tokens", { value: Math.ceil(prompt.length / 4).toLocaleString() }) }),
        element("span", { textContent: t(locale, "prompt.selectedEvidence", { value: Number(metadata.selectedEvidenceCount ?? 0).toLocaleString() }) }),
      ]),
      element("label", { className: "prompt-output-label", htmlFor: "promptOutput", textContent: t(locale, "prompt.output") }, [output]),
      element("section", { className: "prompt-detail-section", "aria-labelledby": "promptStandardsTitle" }, [element("h3", { id: "promptStandardsTitle", textContent: t(locale, "prompt.standards") }), element("ul", { className: "prompt-checklist" }, standards)]),
      element("section", { className: "prompt-detail-section", "aria-labelledby": "promptQualityTitle" }, [element("h3", { id: "promptQualityTitle", textContent: t(locale, "prompt.quality") }), element("ul", { className: "prompt-checklist" }, checklist)]),
      element("section", { className: "prompt-detail-section", "aria-labelledby": "promptSafeguardsTitle" }, [element("h3", { id: "promptSafeguardsTitle", textContent: t(locale, "prompt.safeguards") }), element("ul", { className: "prompt-checklist" }, safeguards)]),
    ],
  };
}

export function closePromptDrawer(root) {
  const entry = drawerEntries.get(root);
  if (!entry) return;
  drawerEntries.delete(root);
  if (entry.native && entry.dialog.open) entry.dialog.close();
  entry.container.replaceChildren();
  root.dispatchEvent(new CustomEvent("prompt:closed", { bubbles: true }));
  entry.trigger?.focus();
}

export async function copyPrompt(prompt, clipboard = navigator.clipboard) {
  if (clipboard?.writeText) {
    await clipboard.writeText(prompt);
    return "copied";
  }
  return "manual-copy-required";
}

export function downloadPrompt(prompt, { researchTypeId, stageId, now = new Date() }) {
  const date = now.toISOString().slice(0, 10);
  const filename = `research-prompt-${researchTypeId}-${stageId}-${date}.txt`;
  const url = URL.createObjectURL(new Blob([prompt], { type: "text/plain;charset=utf-8" }));
  return { filename, url };
}

export function openPromptDrawer(root, prompt, trigger, metadata = {}) {
  closePromptDrawer(root);
  const container = root.querySelector("#promptDrawerRoot");
  const locale = metadata.locale ?? root.documentElement.lang ?? "en";
  const drawer = drawerContent(prompt, locale, metadata);
  const native = typeof HTMLDialogElement !== "undefined" && typeof HTMLDialogElement.prototype.showModal === "function";
  const dialog = native
    ? element("dialog", { className: "prompt-drawer", "aria-labelledby": drawer.headingId })
    : element("section", { className: "prompt-drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": drawer.headingId });
  dialog.append(...drawer.content);
  container.replaceChildren(native ? dialog : element("div", { className: "prompt-drawer-backdrop" }, [dialog]));
  drawerEntries.set(root, { container, dialog, native, trigger });
  drawer.close.addEventListener("click", () => closePromptDrawer(root));
  drawer.copy.addEventListener("click", () => root.dispatchEvent(new CustomEvent("prompt:copy", { bubbles: true, detail: { prompt, output: drawer.output } })));
  drawer.download.addEventListener("click", () => root.dispatchEvent(new CustomEvent("prompt:download", { bubbles: true, detail: { prompt } })));
  dialog.addEventListener("cancel", event => { event.preventDefault(); closePromptDrawer(root); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePromptDrawer(root);
    }
  });
  if (native) dialog.showModal();
  drawer.copy.focus();
  return drawer.output;
}
