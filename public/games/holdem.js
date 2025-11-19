// ===============================
// TEXAS HOLD'EM — SHOWDOWN ENGINE
// ===============================

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createCardEl(card, opts = {}) {
  const el = document.createElement("div");
  el.className = "card";
  if (opts.small) el.classList.add("small");
  if (["♥","♦"].includes(card.suit)) el.classList.add("red");
  el.textContent = card.rank + card.suit;
  return el;
}

function makeDeck() {
  const d = [];
  for (const s of SUITS) {
    for (const r of RANKS) d.push({ rank: r, suit: s });
  }
  return d;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

(function setupHoldem(){
  const oppSel = document.getElementById("hOppCount");
  const btn = document.getElementById("hNewHandBtn");
  const boardEl = document.getElementById("hBoard");
  const playersEl = document.getElementById("hPlayers");
  const statusEl = document.getElementById("hStatus");

  let deck = [];
  let board = [];
  let players = [];

  const RVAL = {
    "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,
    "8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14
  };

  // Evaluate best 5 from 7 — returns score + label
  function eval7(cards){
    const counts = {};
    const suits = {};

    for(const c of cards){
      const rv = RVAL[c.rank];
      counts[rv] = (counts[rv] || 0) + 1;
      suits[c.suit] = (suits[c.suit] || 0) + 1;
    }

    const unique = Object.keys(counts).map(Number).sort((a,b)=>b-a);
    let flushSuit = null;

    for(const s of SUITS){
      if((suits[s]||0) >= 5){
        flushSuit = s;
        break;
      }
    }

    let flushVals = [];
    if(flushSuit){
      flushVals = cards.filter(c=>c.suit===flushSuit)
                       .map(c=>RVAL[c.rank])
                       .sort((a,b)=>b-a);
    }

    function bestStraight(vals){
      if(vals.length < 5) return null;
      const v = [...new Set(vals)];
      if(v.includes(14)) v.push(1);
      let best = null;

      for(let i=0;i<v.length;i++){
        let run=[v[i]];
        for(let j=i+1;j<v.length && run.length<5;j++){
          if(v[j] === run[run.length-1]-1){
            run.push(v[j]);
          }else if(v[j] === run[run.length-1]){
            continue;
          }else break;
        }
        if(run.length>=5){
          let top = run[0];
          if(run[0]===14 && run[1]===5) top = 5;
          if(!best || top>best) best = top;
        }
      }
      return best;
    }

    const straightHigh = bestStraight(unique);
    let sfHigh = null;
    if(flushVals.length >= 5) sfHigh = bestStraight(flushVals);

    const fours=[], threes=[], pairs=[];
    for(const rv of unique){
      const c = counts[rv];
      if(c===4) fours.push(rv);
      else if(c===3) threes.push(rv);
      else if(c===2) pairs.push(rv);
    }

    let cat=0, scoreParts=[0,0,0,0,0], label="High Card";

    if(sfHigh){
      cat = 8;
      label = sfHigh===14 ? "Royal Flush" : "Straight Flush";
      scoreParts[0] = sfHigh;
    } 
    else if(fours.length){
      cat = 7;
      label = "Four of a Kind";
      scoreParts[0]=fours[0];
      const kicker = unique.find(v=>v!==fours[0])||0;
      scoreParts[1]=kicker;
    }
    else if(threes.length && (pairs.length || threes.length>1)){
      cat=6;
      label="Full House";
      const three=threes[0];
      const pair=(threes.length>1?threes[1]:pairs[0]);
      scoreParts[0]=three;
      scoreParts[1]=pair;
    }
    else if(flushSuit){
      cat=5;
      label="Flush";
      for(let i=0;i<5;i++) scoreParts[i] = flushVals[i]||0;
    }
    else if(straightHigh){
      cat=4;
      label="Straight";
      scoreParts[0]=straightHigh;
    }
    else if(threes.length){
      cat=3;
      label="Three of a Kind";
      scoreParts[0]=threes[0];
      const kickers=unique.filter(v=>v!==threes[0]).slice(0,2);
      scoreParts[1]=kickers[0]||0;
      scoreParts[2]=kickers[1]||0;
    }
    else if(pairs.length>=2){
      cat=2;
      label="Two Pair";
      const [hi,lo]=pairs.slice(0,2);
      scoreParts[0]=hi;
      scoreParts[1]=lo;
      const kicker=unique.find(v=>v!==hi && v!==lo)||0;
      scoreParts[2]=kicker;
    }
    else if(pairs.length===1){
      cat=1;
      label="One Pair";
      const p=pairs[0];
      scoreParts[0]=p;
      const kickers=unique.filter(v=>v!==p).slice(0,3);
      scoreParts[1]=kickers[0]||0;
      scoreParts[2]=kickers[1]||0;
      scoreParts[3]=kickers[2]||0;
    }
    else {
      cat=0;
      label="High Card";
      for(let i=0;i<5;i++) scoreParts[i]=unique[i]||0;
    }

    let score = cat * 1e10;
    for(let i=0;i<5;i++){
      score += scoreParts[i] * Math.pow(100, 4-i);
    }

    return { score, label };
  }

  function renderBoard(){
    boardEl.innerHTML = "";
    board.forEach(c => {
      boardEl.appendChild(createCardEl(c));
    });
  }

  function renderPlayers(){
    playersEl.innerHTML = "";
    players.forEach(p => {
      const seat = document.createElement("div");
      seat.className = "h-seat" + (p.isHuman ? " you" : "");

      const head = document.createElement("div");
      head.className = "h-head";

      const nameEl = document.createElement("div");
      nameEl.className = "h-name";
      nameEl.textContent = p.name;
      head.appendChild(nameEl);

      const tag = document.createElement("div");
      tag.className = "h-tag" + (p.winner ? " winner" : "");
      tag.textContent = p.winner ? "Winner" : (p.isHuman?"You":"CPU");
      head.appendChild(tag);

      seat.appendChild(head);

      const handRow = document.createElement("div");
      handRow.className = "h-handrow";

      const cardWrap = document.createElement("div");
      cardWrap.className = "h-cards";
      p.hand.forEach(c => cardWrap.appendChild(createCardEl(c,{small:true})));
      handRow.appendChild(cardWrap);

      const note = document.createElement("div");
      note.className = "h-note";
      note.textContent = p.bestLabel;
      handRow.appendChild(note);

      seat.appendChild(handRow);
      playersEl.appendChild(seat);
    });
  }

  function dealHand(){
    const opp = parseInt(oppSel.value,10);
    deck = makeDeck();
    shuffle(deck);

    players = [];
    board = [];

    // Player
    players.push({
      name:"You",
      isHuman:true,
      hand:[ deck.pop(), deck.pop() ],
      score:0,
      winner:false,
      bestLabel:""
    });

    // CPUs
    for(let i=1;i<=opp;i++){
      players.push({
        name:`CPU ${i}`,
        isHuman:false,
        hand:[ deck.pop(), deck.pop() ],
        score:0,
        winner:false,
        bestLabel:""
      });
    }

    // Board
    board = [ deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop() ];

    renderBoard();

    // Evaluate
    let best=-1;
    players.forEach(p => {
      const evald = eval7([...p.hand, ...board]);
      p.score = evald.score;
      p.bestLabel = evald.label;
      if(evald.score > best) best = evald.score;
    });

    players.forEach(p => {
      p.winner = (p.score === best);
    });

    renderPlayers();

    const winners = players.filter(p => p.winner);
    if(winners.length === 1){
      statusEl.textContent = `${winners[0].isHuman ? "You" : winners[0].name} win with ${winners[0].bestLabel}!`;
    } else {
      const names = winners.map(w=> w.isHuman?"You":w.name).join(", ");
      statusEl.textContent = `Split pot between ${names} (${winners[0].bestLabel})`;
    }
  }

  btn.onclick = dealHand;

})();
