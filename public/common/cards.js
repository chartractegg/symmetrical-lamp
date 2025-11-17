/* ============================================================
   cards.js — Shared Card Utilities for Retro Blackjack
   Symmetrical Lamp
   ============================================================ */

export const SUITS = ["♠", "♥", "♦", "♣"];
export const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

/** Returns true if suit is red */
export function isRed(suit) {
  return suit === "♥" || suit === "♦";
}

/** Returns blackjack-style numeric value for a given rank */
export function cardValue(rank) {
  if (rank === "A") return 11;
  if (["10","J","Q","K"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/** Calculate total with ace softening */
export function handTotal(cards) {
  let total = 0;
  let aces = 0;

  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

/** Create a card DOM element */

export function createCardElement(card, { order = 0 } = {}) {
  const el = document.createElement("div");
  el.className = "card";
  el.style.order = order;

  const rank = document.createElement("div");
  rank.className = "rank";
  rank.textContent = card.rank;

  const suit = document.createElement("div");
  suit.className = "suit";
  suit.textContent = card.suit;

  el.appendChild(rank);
  el.appendChild(suit);

  return el;
}

export function createBackCard({ order = 0 } = {}) {
  const el = document.createElement("div");
  el.className = "card back";
  el.style.order = order;
  return el;
}

/** Create back-of-card DOM element */
export function createBackCard() {
  const el = document.createElement("div");
  el.className = "card back";
  return el;
}

/**
 * Append a card element into a container and wait for its animation.
 * Example:
 *   await dealTo(container, cardEl);
 */
export async function dealTo(container, cardEl) {
  container.appendChild(cardEl);

  if (cardEl.classList.contains("fly") || 
      cardEl.classList.contains("flip")) {
    await new Promise(resolve => {
      const handler = () => {
        cardEl.removeEventListener("animationend", handler);
        resolve();
      };
      cardEl.addEventListener("animationend", handler);
    });
  }
}
