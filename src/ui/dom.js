export function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { dataset, ...properties } = options;

  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (key.includes("-")) node.setAttribute(key, String(value));
    else node[key] = value;
  }
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}

export function option(value, label, selected = false, disabled = false) {
  return element("option", { value, textContent: label, selected, disabled });
}
