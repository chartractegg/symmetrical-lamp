
export const deck = [];
const suits=['♠','♥','♦','♣'];
const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
for(const s of suits){
  for(const r of ranks){ deck.push({rank:r, suit:s}); }
}
export function draw(deckArr){
  return deckArr.splice(Math.floor(Math.random()*deckArr.length),1)[0];
}
