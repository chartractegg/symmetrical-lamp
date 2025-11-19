// ============================================================
//  KLONDIKE SOLITAIRE — DRAW 3
//  Full engine — dragging, rules, foundations, draw-3 logic
// ============================================================

(function(){

// ---------- CARD CONSTANTS ----------
const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function isRed(s){
  return s === "♥" || s === "♦";
}

function rankValue(r){
  return RANKS.indexOf(r); // 0..12
}

// ---------- STATE ----------
let stock = [];      // remaining draw pile
let waste = [];      // top of waste is last
let foundations = [[],[],[],[]];
let tableau = [[],[],[],[],[],[],[]];

// drag state
let dragCards = [];
let dragOrigin = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragging = false;

// DOM references
const stockEl = document.getElementById("stock");
const wasteEl = document.getElementById("waste");
const foundationEls = [
  document.getElementById("foundation0"),
  document.getElementById("foundation1"),
  document.getElementById("foundation2"),
  document.getElementById("foundation3")
];
const tableauEls = [
  document.getElementById("tableau0"),
  document.getElementById("tableau1"),
  document.getElementById("tableau2"),
  document.getElementById("tableau3"),
  document.getElementById("tableau4"),
  document.getElementById("tableau5"),
  document.getElementById("tableau6")
];

const gameArea = document.getElementById("gameArea");

// ---------- SETUP ----------
function newDeck(){
  const d=[];
  for(const s of SUITS){
    for(const r of RANKS){
      d.push({
        rank:r,
        suit:s,
        faceUp:false,
        el:null // attached later
      });
    }
  }
  return d;
}

function shuffleDeck(d){
  for(let i=d.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [d[i],d[j]]=[d[j],d[i]];
  }
}

function dealGame(){
  const d = newDeck();
  shuffleDeck(d);

  // clear state
  stock.length=0;
  waste.length=0;
  foundations.forEach(f=>f.length=0);
  tableau.forEach(t=>t.length=0);

  // deal tableau: 1..7
  let index=0;
  for(let col=0;col<7;col++){
    for(let i=0;i<=col;i++){
      const card = d[index++];
      tableau[col].push(card);
    }
    tableau[col][col].faceUp=true; // last dealt face up
  }

  // rest into stock, all face down
  while(index<d.length){
    const c = d[index++];
    c.faceUp=false;
    stock.push(c);
  }

  renderAll();
}

// ---------- RENDERING ----------
function createCardElement(card){
  const el=document.createElement("div");
  el.className="card";
  if(!card.faceUp){
    el.classList.add("back");
  }else{
    if(isRed(card.suit)) el.classList.add("red");
    el.textContent = card.rank + card.suit;
  }
  el.style.left="0px";
  el.style.top="0px";

  el.onmousedown = e => startDrag(e, card);

  card.el = el;
  return el;
}

function renderPile(pileEl, pileArray, isTableau){
  pileEl.innerHTML="";
  let y=0;
  for(const card of pileArray){
    if(!card.el) createCardElement(card);
    pileEl.appendChild(card.el);
    card.el.style.top = y+"px";
    card.el.style.left = "0px";

    if(isTableau){
      y += card.faceUp ? 26 : 12;
    }
  }
}

function renderAll(){
  // stock
  stockEl.innerHTML="";
  if(stock.length){
    const top = stock[stock.length-1];
    if(!top.el) createCardElement(top);
    stockEl.appendChild(top.el);
  }

  // waste
  wasteEl.innerHTML="";
  if(waste.length){
    const top = waste[waste.length-1];
    if(!top.el) createCardElement(top);
    top.el.style.left="0px";
    top.el.style.top="0px";
    wasteEl.appendChild(top.el);
  }

  foundations.forEach((f,i)=>renderPile(foundationEls[i], f, false));
  tableau.forEach((t,i)=>renderPile(tableauEls[i], t, true));
}

// ---------- DRAW 3 STOCK ----------
stockEl.onclick = () => {
  if(isDragging) return;

  if(stock.length===0){
    // recycle waste back to stock
    while(waste.length){
      const c = waste.pop();
      c.faceUp=false;
      stock.push(c);
    }
    renderAll();
    return;
  }

  // draw up to 3
  let take = Math.min(3, stock.length);
  const draw = [];

  for(let i=0;i<take;i++){
    const c = stock.pop();
    c.faceUp=true;
    draw.push(c);
  }

  // push them in order drawn
  for(const c of draw){
    waste.push(c);
  }

  renderAll();
};


// ---------- DRAGGING LOGIC ----------
function startDrag(e, card){
  if(!card.faceUp) return;

  e.preventDefault();

  // determine card stack (tableau or waste)
  let pileType=null;
  let pileIndex=-1;
  let pile=null;

  // check tableau
  for(let i=0;i<7;i++){
    let idx = tableau[i].indexOf(card);
    if(idx !== -1){
      pileType="tableau";
      pileIndex=i;
      pile=tableau[i];
      break;
    }
  }

  // check waste
  if(!pileType){
    const idx = waste.indexOf(card);
    if(idx !== -1){
      pileType="waste";
      pileIndex=-1;
      pile=waste;
    }
  }

  if(!pileType) return;

  // build drag stack (in tableau you drag this + all above it)
  const idx = pile.indexOf(card);
  dragCards = pile.slice(idx);
  dragOrigin = { type:pileType, index:pileIndex, start:idx };

  // bring to front
  for(const c of dragCards){
    c.el.classList.add("dragging");
  }

  // compute offset from click
  const rect = card.el.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  isDragging=true;

  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);
}

function onDragMove(e){
  if(!isDragging) return;

  const x = e.clientX - dragOffsetX - gameArea.getBoundingClientRect().left;
  const y = e.clientY - dragOffsetY - gameArea.getBoundingClientRect().top;

  // stack them vertically with same offsets
  dragCards.forEach((c,i)=>{
    c.el.style.position="absolute";
    c.el.style.zIndex=9999;
    c.el.style.left = x+"px";
    c.el.style.top = (y + i*26)+"px";
    gameArea.appendChild(c.el);
  });
}

function onDragEnd(e){
  if(!isDragging) return;

  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);

  // Try to drop on foundation or tableau
  let dropTarget = document.elementFromPoint(e.clientX, e.clientY);

  let placed = false;

  if(dropTarget){
    placed = tryPlace(dragCards, dropTarget);
  }

  if(!placed){
    // Return them to origin
    returnDraggedToOrigin();
  }

  // cleanup dragging
  dragCards.forEach(c=>c.el.classList.remove("dragging"));
  dragCards=[];
  dragOrigin=null;
  isDragging=false;

  renderAll();
  checkWin();
}

function returnDraggedToOrigin(){
  const { type, index, start } = dragOrigin;
  let pile = null;

  if(type==="tableau"){
    pile = tableau[index];
  } else if(type==="waste"){
    pile = waste;
  }

  if(pile){
    // put dragged cards back in place
    const before = pile.slice(0,start);
    const after = pile.slice(start + dragCards.length);
    pile.length=0;
    before.forEach(c=>pile.push(c));
    dragCards.forEach(c=>pile.push(c));
    after.forEach(c=>pile.push(c));
  }
}


// ---------- DROP RULES ----------

function tryPlace(cards, dropTarget){
  // climb up dom until reaching a pile
  while(dropTarget && !dropTarget.classList.contains("pile")){
    dropTarget = dropTarget.parentElement;
  }
  if(!dropTarget) return false;

  const card = cards[0]; // the first dragged card

  // foundation?
  const fIndex = foundationEls.indexOf(dropTarget);
  if(fIndex !== -1){
    return placeOnFoundation(cards, fIndex);
  }

  // tableau?
  const tIndex = tableauEls.indexOf(dropTarget);
  if(tIndex !== -1){
    return placeOnTableau(cards, tIndex);
  }

  return false;
}

// --- FOUNDATION RULES ---
function placeOnFoundation(cards, idx){
  if(cards.length>1) return false; // only one card allowed

  const card = cards[0];
  const pile = foundations[idx];

  if(pile.length===0){
    if(card.rank==="A"){
      moveCardsFromOrigin(cards, pile);
      return true;
    }
    return false;
  }

  const top = pile[pile.length-1];
  if(top.suit===card.suit && rankValue(card.rank)===rankValue(top.rank)+1){
    moveCardsFromOrigin(cards, pile);
    return true;
  }

  return false;
}

// --- TABLEAU RULES ---
function placeOnTableau(cards, idx){
  const pile = tableau[idx];

  const first = cards[0];

  if(pile.length===0){
    // only king allowed
    if(first.rank==="K"){
      moveCardsFromOrigin(cards, pile);
      return true;
    }
    return false;
  }

  const top = pile[pile.length-1];
  if(!top.faceUp) return false;

  const validColor = isRed(top.suit) !== isRed(first.suit);
  const validRank = rankValue(first.rank) === rankValue(top.rank)-1;

  if(validColor && validRank){
    moveCardsFromOrigin(cards, pile);
    return true;
  }

  return false;
}


// ---------- MOVE ----------
function moveCardsFromOrigin(cards, destPile){
  const { type, index, start } = dragOrigin;

  let originPile = null;

  if(type==="tableau"){
    originPile = tableau[index];
  } else if(type==="waste"){
    originPile = waste;
  }

  if(!originPile) return;

  // remove from origin
  const before = originPile.slice(0,start);
  const after = originPile.slice(start + cards.length);
  originPile.length=0;
  before.forEach(c=>originPile.push(c));
  after.forEach(c=>originPile.push(c));

  // add to dest
  cards.forEach(c=>destPile.push(c));

  // flip top of tableau origin if needed
  if(type==="tableau"){
    if(originPile.length){
      const top = originPile[originPile.length-1];
      if(!top.faceUp){
        top.faceUp=true;
      }
    }
  }
}


// ---------- WIN CHECK ----------
function checkWin(){
  const total = foundations.reduce((n,f)=>n+f.length,0);
  if(total===52){
    setTimeout(()=>alert("You win!"), 200);
  }
}

// ---------- START GAME ----------
dealGame();

})();
