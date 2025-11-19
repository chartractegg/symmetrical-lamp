// ===========================
// FULL BACCARAT IMPLEMENTATION
// ===========================

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function isRedSuit(suit){
  return suit === "♥" || suit === "♦";
}

function createCardEl(card){
  const el = document.createElement("div");
  el.className = "card";
  if(isRedSuit(card.suit)) el.classList.add("red");
  el.textContent = card.rank + card.suit;
  return el;
}

function makeDeck(){
  const d=[];
  for(const s of SUITS){
    for(const r of RANKS){
      d.push({rank:r, suit:s});
    }
  }
  return d;
}

function shuffle(deck){
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
}

function cardValue(rank){
  if(rank==="A") return 1;
  if(["10","J","Q","K"].includes(rank)) return 0;
  return parseInt(rank,10);
}

function handTotal(cards){
  let t=0;
  for(const c of cards) t += cardValue(c.rank);
  return t % 10;
}

(function setupBaccarat(){
  const bankEl = document.getElementById("bacBank");
  const betInput = document.getElementById("bacBet");
  const dealBtn = document.getElementById("bacDealBtn");
  const msgEl = document.getElementById("bacMessage");

  const playerRow = document.getElementById("bacPlayerCards");
  const bankerRow = document.getElementById("bacBankerCards");
  const pTotalEl = document.getElementById("bacPlayerTotal");
  const bTotalEl = document.getElementById("bacBankerTotal");

  let bank = 1000;
  let deck = [];

  function getSide(){
    return document.querySelector("input[name='bacSide']:checked").value;
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

  function clearTable(){
    playerRow.innerHTML = "";
    bankerRow.innerHTML = "";
    pTotalEl.textContent = "";
    bTotalEl.textContent = "";
    msgEl.textContent = "";
  }

  // ------------------------------
  // THIRD CARD RULES — THE REAL DEAL
  // ------------------------------

  function playerShouldDraw(pTotal){
    return pTotal <= 5;   // unless natural handled earlier
  }

  // BANKER'S COMPLEX DRAWING RULES
  function bankerShouldDraw(bTotal, playerThird){
    if(playerThird === null){
      return bTotal <= 5; // simple case
    }

    // The real Banker table:
    if(bTotal <= 2) return true;

    if(bTotal === 3) return playerThird.rank !== "8";
    if(bTotal === 4){
      return ["2","3","4","5","6","7"].includes(playerThird.rank);
    }
    if(bTotal === 5){
      return ["4","5","6","7"].includes(playerThird.rank);
    }
    if(bTotal === 6){
      return ["6","7"].includes(playerThird.rank);
    }

    return false;
  }

  // ------------------------------

  function onDeal(){
    clearTable();

    const rawBet = parseInt(betInput.value,10) || 0;
    if(rawBet <= 0){
      msgEl.textContent = "Bet must be > 0.";
      return;
    }
    if(rawBet > bank){
      msgEl.textContent = "Bet exceeds bank.";
      return;
    }

    const side = getSide();

    bank -= rawBet;
    bankEl.textContent = bank;

    // Initial two cards each
    const player = [draw(), draw()];
    const banker = [draw(), draw()];

    player.forEach(c => playerRow.appendChild(createCardEl(c)));
    banker.forEach(c => bankerRow.appendChild(createCardEl(c)));

    let pTotal = handTotal(player);
    let bTotal = handTotal(banker);

    // NATURAL END (8 or 9)
    if(pTotal >= 8 || bTotal >= 8){
      pTotalEl.textContent = pTotal;
      bTotalEl.textContent = bTotal;
      return settle(rawBet, side, pTotal, bTotal);
    }

    // PLAYER THIRD CARD?
    let playerThird = null;
    if(playerShouldDraw(pTotal)){
      playerThird = draw();
      player.push(playerThird);
      playerRow.appendChild(createCardEl(playerThird));
      pTotal = handTotal(player);
    }

    // BANKER THIRD card?
    let bankerThird = null;
    if(bankerShouldDraw(bTotal, playerThird)){
      bankerThird = draw();
      banker.push(bankerThird);
      bankerRow.appendChild(createCardEl(bankerThird));
      bTotal = handTotal(banker);
    }

    pTotalEl.textContent = pTotal;
    bTotalEl.textContent = bTotal;

    settle(rawBet, side, pTotal, bTotal);
  }

  function settle(bet, side, p, b){
    let winner = "tie";
    if(p > b) winner = "player";
    else if(b > p) winner = "banker";

    let payout = 0;

    if(side === winner){
      if(winner === "player"){
        payout = bet;
        bank += bet + payout;
        msgEl.textContent = `Player wins. Payout $${payout}.`;
      }else if(winner === "banker"){
        payout = Math.floor(bet * 0.95);
        bank += bet + payout;
        msgEl.textContent = `Banker wins. Payout $${payout} (5% commission).`;
      }else{
        payout = bet * 8;
        bank += bet + payout;
        msgEl.textContent = `Tie wins! Payout $${payout}.`;
      }
    }else{
      msgEl.textContent = `${winner.charAt(0).toUpperCase()+winner.slice(1)} wins. You lose $${bet}.`;
    }

    bankEl.textContent = bank;
  }

  dealBtn.onclick = onDeal;
  bankEl.textContent = bank;

})();
