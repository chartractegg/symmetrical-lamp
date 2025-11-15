/* ============================================================
   utils.js — Shared Utilities for Symmetrical Lamp Retro Games
   ============================================================ */

/**
 * Sleep helper for animations
 * Usage: await sleep(250)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random integer between min and max (inclusive)
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp number to a range
 */
export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Shuffle array in-place (Fisher-Yates)
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates and returns an element with class(es).
 * Example:
 *   const div = el("div", "panel");
 *   const box = el("div", ["card", "fly"]);
 */
export function el(tag, className) {
  const node = document.createElement(tag);

  if (Array.isArray(className)) {
    className.forEach(c => node.classList.add(c));
  } else if (typeof className === "string") {
    node.classList.add(className);
  }

  return node;
}

/**
 * Format numbers with commas
 */
export function fmt(num) {
  return Number(num).toLocaleString();
}

/**
 * Promise to wait for a CSS animation to finish
 * Usage:
 *   await waitForAnimation(element)
 */
export function waitForAnimation(element) {
  return new Promise(resolve => {
    const handler = () => {
      element.removeEventListener("animationend", handler);
      resolve();
    };
    element.addEventListener("animationend", handler);
  });
}

/**
 * Injects text into a monospace ASCII box with word-wrapping
 */
export function setAsciiText(el, text) {
  el.textContent = text;
}
