// ======================
// SIMPLE BLACKJACK ENGINE
// ======================

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function isRedSuit(suit){
  return suit === "♥" || suit === "♦";
}

function makeDeck(){
  const deck = [];
  for(const s of SUITS){
    for(const r of RANKS){
      deck.push({ rank:r, suit:s });
    }
  }
  return deck;
}

function shuffle(deck){
  for(let i = deck.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function createCardEl(card, opts={}){
  const el = document.createElement('div');
  el.className = 'card';

  if(opts.small) el.classList.add('small');
  if(opts.back){
    el.classList.add('back');
    return el;
  }
  if(isRedSuit(card.suit)) el.classList.add('red');

  el.textContent = card.rank + card.suit;
  return el;
}

(function setupBlackjack(){
  const dealerRow = document.getElementById('bjDealerCards');
  const playerRow = document.getElementById('bjPlayerCards');
  const dealerTotalEl = document.getElementById('bjDealerTotal');
  const playerTotalEl = document.getElementById('bjPlayerTotal');
  const bankEl = document.getElementById('bjBank');
  const betInput = document.getElementById('bjBet');
  const dealBtn = document.getElementById('bjDealBtn');
  const hitBtn = document.getElementById('bjHitBtn');
  const standBtn = document.getElementById('bjStandBtn');
  const doubleBtn = document.getElementById('bjDoubleBtn');
  const msgEl = document.getElementById('bjMessage');
  const resultEl = document.getElementById('bjResultText');

  let deck = [];
  let bank = 1000;
  let bet = 50;
  let playerHand = [];
  let dealerHand = [];
  let inRound = false;
  let canDouble = false;

  function bjCardValue(rank){
    if(rank === "A") return 11;
    if(["K","Q","J"].includes(rank)) return 10;
    return parseInt(rank,10);
  }

  function bjHandTotal(hand){
    let total = 0;
    let aces = 0;

    for(const c of hand){
      total += bjCardValue(c.rank);
      if(c.rank === "A") aces++;
    }

    while(total > 21 && aces > 0){
      total -= 10;
      aces--;
    }
    return total;
  }

  function ensureDeck(){
    if(deck.length < 10){
      deck = makeDeck();
      shuffle(deck);
    }
  }

  function draw(){
    ensureDeck();
    return deck.pop();
  }

  function renderHands(revealDealer){
    dealerRow.innerHTML = '';
    playerRow.innerHTML = '';

    dealerHand.forEach((c, idx) => {
      const faceDown = (idx === 1 && !revealDealer);
      dealerRow.appendChild(createCardEl(c, { back: faceDown }));
    });

    playerHand.forEach(c => {
      playerRow.appendChild(createCardEl(c));
    });

    const p = bjHandTotal(playerHand);
    const d = revealDealer
      ? bjHandTotal(dealerHand)
      : bjCardValue(dealerHand[0].rank);

    playerTotalEl.textContent = p;
    dealerTotalEl.textContent = d;
  }

  function startDeal(){
    msgEl.textContent = '';
    resultEl.textContent = '—';

    const raw = parseInt(betInput.value,10);
    if(!raw || raw <= 0) return msgEl.textContent = "Invalid bet.";
    if(raw > bank) return msgEl.textContent = "Bet exceeds bank.";

    bet = raw;
    bank -= bet;
    bankEl.textContent = bank;

    playerHand = [draw(), draw()];
    dealerHand = [draw(), draw()];

    inRound = true;
    canDouble = true;

    renderHands(false);
    updateButtons();
  }

  function dealerPlay(){
    while(bjHandTotal(dealerHand) < 17){
      dealerHand.push(draw());
    }
  }

  function endRound(){
    const p = bjHandTotal(playerHand);
    const d = bjHandTotal(dealerHand);

    renderHands(true);

    let delta = 0;

    if(p > 21){
      resultEl.textContent = `Bust. You lose $${bet}.`;
      delta = -bet;
    }else if(d > 21){
      resultEl.textContent = `Dealer busts. You win $${bet}.`;
      delta = bet;
    }else if(p > d){
      resultEl.textContent = `You win $${bet}.`;
      delta = bet;
    }else if(p < d){
      resultEl.textContent = `Dealer wins. You lose $${bet}.`;
      delta = -bet;
    }else{
      resultEl.textContent = "Push.";
      bank += bet;
    }

    if(delta > 0){
      bank += bet + delta;
    }

    bankEl.textContent = bank;

    inRound = false;
    canDouble = false;
    updateButtons();
  }

  function onHit(){
    if(!inRound) return;

    playerHand.push(draw());
    canDouble = false;
    renderHands(false);

    if(bjHandTotal(playerHand) > 21){
      endRound();
    }
  }

  function onStand(){
    if(!inRound) return;

    canDouble = false;
    dealerPlay();
    endRound();
  }

  function onDouble(){
    if(!inRound || !canDouble) return;
    if(bank < bet) return;

    bank -= bet;
    bet *= 2;
    bankEl.textContent = bank;

    playerHand.push(draw());
    renderHands(false);

    if(bjHandTotal(playerHand) > 21){
      endRound();
    }else{
      dealerPlay();
      endRound();
    }
  }

  function updateButtons(){
    dealBtn.disabled   = inRound || bank <= 0;
    hitBtn.disabled    = !inRound;
    standBtn.disabled  = !inRound;
    doubleBtn.disabled = !inRound || !canDouble || bank < bet;
  }

  dealBtn.onclick = startDeal;
  hitBtn.onclick = onHit;
  standBtn.onclick = onStand;
  doubleBtn.onclick = onDouble;

  updateButtons();
})();
