
// ============================================================
// Blackjack animations helpers
// (kept intentionally light - CSS handles most visuals)
// ============================================================
export function flashMessage(el) {
  if (!el) return;
  el.classList.remove("flash");
  // force reflow
  void el.offsetWidth;
  el.classList.add("flash");
}

export function pulseElement(el) {
  if (!el) return;
  el.classList.remove("pulse");
  void el.offsetWidth;
  el.classList.add("pulse");
}
