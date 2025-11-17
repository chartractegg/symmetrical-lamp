
// ============================================================
// Blackjack main logic - Retro Symmetrical Lamp
// ============================================================
import { shuffle, el as makeEl } from "../common/utils.js";
import { handTotal, createCardElement, createBackCard } from "../common/cards.js";

const bankEl      = document.getElementById("bank");
const betDispEl   = document.getElementById("betDisp");
const shoeLeftEl  = document.getElementById("shoeLeft");
const betInput    = document.getElementById("bet");
const dealerTotEl = document.getElementById("dealerTot");
const dealerCardsEl = document.getElementById("dealerCards");
const handsEl     = document.getElementById("hands");
const msgEl       = document.getElementById("msg");

const dealBtn     = document.getElementById("deal");
const hitBtn      = document.getElementById("hit");
const standBtn    = document.getElementById("stand");
const moreBtn     = document.getElementById("more");
const moreMenu    = document.getElementById("moreMenu");
const doubleBtn   = document.getElementById("double");
const splitBtn    = document.getElementById("split");
const surrenderBtn= document.getElementById("surrender");
const newShoeBtn  = document.getElementById("newShoe");

// ------------ State -------------
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const DECKS_IN_SHOE = 6;

let shoe = [];
let bank = 1000;
let currentBet = 10;

let dealerHand = [];
let playerHands = []; // support for potential splits later
let activeHandIndex = 0;
let roundInProgress = false;
let dealerReveal = false;

function makeShoe() {
  const cards = [];
  for (let d = 0; d < DECKS_IN_SHOE; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        cards.push({ rank: r, suit: s });
      }
    }
  }
  shuffle(cards);
  shoe = cards;
  updateShoeCount();
}

function drawCard() {
  if (shoe.length === 0) {
    makeShoe();
  }
  const c = shoe.pop();
  updateShoeCount();
  return c;
}

function updateShoeCount() {
  if (shoeLeftEl) shoeLeftEl.textContent = String(shoe.length);
}

function setMessage(text) {
  if (!msgEl) return;
  msgEl.textContent = text || "";
}

function setBank(amount) {
  bank = amount;
  if (bankEl) bankEl.textContent = String(bank);
}

function setBetDisplay(amount) {
  currentBet = amount;
  if (betDispEl) betDispEl.textContent = String(currentBet);
  if (betInput) betInput.value = String(currentBet);
}

function clearTable() {
  dealerHand = [];
  playerHands = [];
  activeHandIndex = 0;
  dealerReveal = false;

  if (dealerCardsEl) dealerCardsEl.innerHTML = "";
  if (dealerTotEl) dealerTotEl.textContent = "0";
  if (handsEl) handsEl.innerHTML = "";
  setMessage("");
}

function renderDealer() {
  if (!dealerCardsEl) return;

  dealerCardsEl.innerHTML = "";
  dealerHand.forEach((card, idx) => {
    if (!dealerReveal && idx === 1) {
      dealerCardsEl.appendChild(createBackCard({ order: idx }));
    } else {
      dealerCardsEl.appendChild(
        createCardElement(card, { order: idx })
      );
    }
  });

  if (dealerTotEl) {
    if (!dealerReveal && dealerHand.length > 0) {
      dealerTotEl.textContent = String(handTotal([dealerHand[0]]));
    } else {
      dealerTotEl.textContent = String(handTotal(dealerHand));
    }
  }
}

function renderHands() {
  if (!handsEl) return;
  handsEl.innerHTML = "";

  playerHands.forEach((hand, idx) => {
    const h = document.createElement("div");
    h.className = "hand" + (idx === activeHandIndex ? " active" : "");

    const cardsRow = document.createElement("div");
    cardsRow.className = "hand-cards";

    hand.cards.forEach((card, ci) => {
      cardsRow.appendChild(
        createCardElement(card, { order: ci })
      );
    });

    const totalRow = document.createElement("div");
    totalRow.className = "hand-total";
    const total = handTotal(hand.cards);
    totalRow.textContent = `Total: ${total}`;

    h.appendChild(cardsRow);
    h.appendChild(totalRow);
    handsEl.appendChild(h);
  });
}

function startRound() {
  if (roundInProgress) return;

  // validate bet
  let bet = parseInt(betInput ? betInput.value : currentBet, 10);
  if (isNaN(bet) || bet <= 0) bet = 10;
  if (bet > bank) {
    setMessage("Bet exceeds bank.");
    return;
  }

  clearTable();
  setBetDisplay(bet);
  setBank(bank - bet);

  // initialize hands
  dealerHand = [];
  playerHands = [{ cards: [], bet }];

  // deal initial cards
  dealerHand.push(drawCard());
  playerHands[0].cards.push(drawCard());
  dealerHand.push(drawCard());
  playerHands[0].cards.push(drawCard());

  roundInProgress = true;
  dealerReveal = false;

  enableInRoundButtons();
  renderDealer();
  renderHands();
  setMessage("Player to act.");
  checkForNaturals();
}

function currentHand() {
  return playerHands[activeHandIndex];
}

function hit() {
  if (!roundInProgress) return;
  const hand = currentHand();
  hand.cards.push(drawCard());
  renderHands();

  const total = handTotal(hand.cards);
  if (total > 21) {
    // bust
    setMessage("Player busts.");
    nextHandOrResolve();
  }
}

function stand() {
  if (!roundInProgress) return;
  nextHandOrResolve();
}

function nextHandOrResolve() {
  if (activeHandIndex < playerHands.length - 1) {
    activeHandIndex++;
    renderHands();
    setMessage("Next hand.");
  } else {
    resolveDealer();
  }
}

export function createBackCard({ order = 0 } = {}) {
  const el = document.createElement("div");
  el.className = "card back";
  el.style.order = order;
  return el;
}

function resolveDealer() {
  dealerReveal = true;
  renderDealer();

  // Dealer hits until 17 or more
  while (handTotal(dealerHand) < 17) {
    dealerHand.push(drawCard());
    renderDealer();
  }

  const dealerTotal = handTotal(dealerHand);

  let totalDelta = 0;
  playerHands.forEach(hand => {
    const pt = handTotal(hand.cards);
    if (pt > 21) {
      // already bust
      totalDelta += 0;
    } else if (dealerTotal > 21 || pt > dealerTotal) {
      // win
      totalDelta += hand.bet * 2;
    } else if (pt === dealerTotal) {
      // push
      totalDelta += hand.bet;
    } else {
      // lose, nothing back
    }
  });

  setBank(bank + totalDelta);
  roundInProgress = false;
  disableInRoundButtons();

  if (dealerTotal > 21) {
    setMessage("Dealer busts. You win.");
  } else {
    setMessage(`Dealer ${dealerTotal}. Round complete.`);
  }
}

function checkForNaturals() {
  const playerTotal = handTotal(playerHands[0].cards);
  const dealerTotal = handTotal(dealerHand);

  const playerBJ = (playerHands[0].cards.length === 2 && playerTotal === 21);
  const dealerBJ = (dealerHand.length === 2 && dealerTotal === 21);

  if (!playerBJ && !dealerBJ) return;

  dealerReveal = true;
  renderDealer();

  if (playerBJ && !dealerBJ) {
    // pay 3:2
    const win = Math.floor(currentBet * 2.5);
    setBank(bank + win);
    setMessage("Blackjack! Paid 3:2.");
  } else if (!playerBJ && dealerBJ) {
    setMessage("Dealer blackjack.");
  } else {
    // push
    setBank(bank + currentBet);
    setMessage("Both blackjack. Push.");
  }

  roundInProgress = false;
  disableInRoundButtons();
}

function enableInRoundButtons() {
  if (hitBtn) hitBtn.disabled = false;
  if (standBtn) standBtn.disabled = false;
  if (doubleBtn) doubleBtn.disabled = true;   // not implemented yet
  if (splitBtn) splitBtn.disabled = true;     // not implemented yet
  if (surrenderBtn) surrenderBtn.disabled = true;
  if (dealBtn) dealBtn.disabled = true;
}

function disableInRoundButtons() {
  if (hitBtn) hitBtn.disabled = true;
  if (standBtn) standBtn.disabled = true;
  if (doubleBtn) doubleBtn.disabled = true;
  if (splitBtn) splitBtn.disabled = true;
  if (surrenderBtn) surrenderBtn.disabled = true;
  if (dealBtn) dealBtn.disabled = false;
}

function toggleMoreMenu() {
  if (!moreMenu) return;
  moreMenu.classList.toggle("open");
}

// ------------ Event wiring ------------

if (betInput) {
  betInput.addEventListener("change", () => {
    let v = parseInt(betInput.value, 10);
    if (isNaN(v) || v <= 0) v = 10;
    setBetDisplay(v);
  });
}

if (dealBtn) dealBtn.addEventListener("click", startRound);
if (hitBtn) hitBtn.addEventListener("click", hit);
if (standBtn) standBtn.addEventListener("click", stand);
if (moreBtn) moreBtn.addEventListener("click", toggleMoreMenu);
if (newShoeBtn) newShoeBtn.addEventListener("click", () => {
  makeShoe();
  setMessage("New shoe created.");
});

// ------------ Init ------------
function init() {
  // initialize bank/bet from DOM if present
  if (bankEl) {
    const domBank = parseInt(bankEl.textContent, 10);
    if (!isNaN(domBank)) bank = domBank;
  }
  if (betDispEl) {
    const domBet = parseInt(betDispEl.textContent, 10);
    if (!isNaN(domBet)) currentBet = domBet;
  }
  setBank(bank);
  setBetDisplay(currentBet);
  makeShoe();
  clearTable();
  disableInRoundButtons();
  setMessage("Click Deal to begin.");
}

document.addEventListener("DOMContentLoaded", init);
