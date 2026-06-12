export function $(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Required element was not found: ${selector}`);
  }
  return element;
}

export function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setHidden(element, hidden) {
  element.hidden = Boolean(hidden);
}
