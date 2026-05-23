/**
 * DOM utility helpers
 */

/** Shortcut for querySelector */
export const $ = (sel, parent = document) => parent.querySelector(sel);

/** Shortcut for querySelectorAll */
export const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/**
 * Create a DOM element with attributes and children.
 * @param {string} tag
 * @param {Record<string, any>} attrs
 * @param {...(string|Node)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Create DOM from an HTML string.
 * Returns the first child element.
 * @param {string} htmlStr
 * @returns {HTMLElement}
 */
export function html(htmlStr) {
  const template = document.createElement('template');
  template.innerHTML = htmlStr.trim();
  return template.content.firstChild;
}

/**
 * Create DOM fragment from an HTML string (multiple root elements).
 * @param {string} htmlStr
 * @returns {DocumentFragment}
 */
export function htmlFragment(htmlStr) {
  const template = document.createElement('template');
  template.innerHTML = htmlStr.trim();
  return template.content;
}

/**
 * Clear a container and append new content.
 * @param {HTMLElement} container
 * @param {...Node} children
 */
export function render(container, ...children) {
  container.innerHTML = '';
  for (const child of children) {
    if (typeof child === 'string') {
      container.innerHTML += child;
    } else if (child instanceof Node) {
      container.appendChild(child);
    }
  }
}
