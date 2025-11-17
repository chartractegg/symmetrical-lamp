
import { deck, draw } from '../common/cards.js';

let shoe = [];
let player = [];
let dealer = [];

function shuffle() {
  shoe = [...deck];
}

function startGame(){
  shuffle();
  player=[draw(shoe),draw(shoe)];
  dealer=[draw(shoe),draw(shoe)];
  console.log("Player:",player,"Dealer:",dealer);
}

startGame();
