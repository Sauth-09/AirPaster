// ---------------------------------------------------------------------------
// DOM Helpers — Thin abstraction over DOM manipulation
// ---------------------------------------------------------------------------

/**
 * Safely query a DOM element by selector.
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
export const $ = (selector) => document.querySelector(selector);

/**
 * Set text content of an element.
 * @param {HTMLElement} element
 * @param {string} text
 * @returns {HTMLElement} The same element (for chaining)
 */
export const setText = (element, text) => {
  if (element) element.textContent = text;
  return element;
};

/**
 * Set innerHTML of an element.
 * @param {HTMLElement} element
 * @param {string} html
 * @returns {HTMLElement}
 */
export const setHTML = (element, html) => {
  if (element) element.innerHTML = html;
  return element;
};

/**
 * Add CSS class(es) to an element.
 * @param {HTMLElement} element
 * @param {...string} classNames
 * @returns {HTMLElement}
 */
export const addClass = (element, ...classNames) => {
  if (element) element.classList.add(...classNames);
  return element;
};

/**
 * Remove CSS class(es) from an element.
 * @param {HTMLElement} element
 * @param {...string} classNames
 * @returns {HTMLElement}
 */
export const removeClass = (element, ...classNames) => {
  if (element) element.classList.remove(...classNames);
  return element;
};

/**
 * Replace all classes with a new set.
 * @param {HTMLElement} element
 * @param {string} baseClass - The base class to always keep
 * @param {string} newClass - The new modifier class
 * @returns {HTMLElement}
 */
export const setStatusClass = (element, baseClass, newClass) => {
  if (!element) return element;
  // Remove all status-related classes, keep base
  const classes = [...element.classList].filter(
    (c) => c === baseClass || !c.startsWith("status-")
  );
  element.className = [...classes, newClass].join(" ");
  return element;
};

/**
 * Show an element by removing the 'hidden' class.
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export const show = (element) => removeClass(element, "hidden");

/**
 * Hide an element by adding the 'hidden' class.
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export const hide = (element) => addClass(element, "hidden");

/**
 * Attach an event listener to an element.
 * @param {HTMLElement} element
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} Cleanup function to remove the listener
 */
export const on = (element, event, handler) => {
  if (!element) return () => {};
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
};
