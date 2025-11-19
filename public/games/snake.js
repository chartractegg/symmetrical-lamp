// ======================
//     SNAKE ENGINE
// ======================

(function setupSnake(){

  const canvas  = document.getElementById('snakeCanvas');
  const ctx     = canvas.getContext('2d');
  const scoreEl = document.getElementById('snakeScore');
  const screen  = document.getElementById('snakeScreen');
  const lbList  = document.getElementById('snakeLeaderboardList');

  const CELL = 10;
  const ROWS = canvas.height / CELL;
  const COLS = canvas.width / CELL;

  const LB_KEY = "snakeHighScores_v1";

  let snake, dir, apple, score, speed, interval, pendingDir;

  // -------------------------------
  //         Leaderboard
  // -------------------------------

  function loadScores(){
    try {
      const raw = localStorage.getItem(LB_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch(e){
      return [];
    }
  }

  function saveScores(list){
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(list));
    } catch(e){}
  }

  function updateLeaderboard(){
    const scores = loadScores();
    lbList.innerHTML = '';

    if (!scores.length){
      const li = document.createElement('li');
      li.textContent = 'No scores yet.';
      lbList.appendChild(li);
      return;
    }

    scores.forEach((entry, i) => {
      const d = entry.when ? new Date(entry.when) : null;
      const ds = d && !isNaN(d) ? ` — ${d.toLocaleDateString()}` : "";
      const li = document.createElement('li');
      li.textContent = `${i+1}. ${entry.score}${ds}`;
      lbList.appendChild(li);
    });
  }

  function recordScore(val){
    if (val <= 0) return;
    let list = loadScores();
    list.push({ score: val, when: new Date().toISOString() });
    list.sort((a,b)=>b.score-a.score);
    list = list.slice(0,10);
    saveScores(list);
  }

  // -------------------------------
  //           Game Logic
  // -------------------------------

  function randomApple(){
    let a;
    do {
      a = {
        x: Math.floor(Math.random()*COLS),
        y: Math.floor(Math.random()*ROWS)
      };
    } while (snake.some(s=>s.x===a.x && s.y===a.y));
    return a;
  }

  function drawBoard(){
    ctx.fillStyle = '#5a7751';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*CELL, y*CELL, CELL-1, CELL-1);
  }

  function loop(){
    if(pendingDir){
      if(!(pendingDir.x === -dir.x && pendingDir.y === -dir.y)){
        dir = pendingDir;
      }
      pendingDir = null;
    }

    const head = {
      x: (snake[0].x + dir.x + COLS) % COLS,
      y: (snake[0].y + dir.y + ROWS) % ROWS
    };

    if (snake.some(s=>s.x===head.x && s.y===head.y)){
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === apple.x && head.y === apple.y){
      score++;
      scoreEl.textContent = score;
      apple = randomApple();
      if (speed > 60){
        clearInterval(interval);
        speed -= 5;
        interval = setInterval(loop, speed);
      }
    } else {
      snake.pop();
    }

    drawBoard();
    drawCell(apple.x, apple.y, '#aaffaa');

    for(const seg of snake){
      drawCell(seg.x, seg.y, '#003300');
    }
  }

  function drawGameOver(){
    ctx.fillStyle = '#4a5f4a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#aaffaa';
    ctx.font = "16px 'Courier New'";
    ctx.fillText('GAME OVER', 65, 150);
    ctx.fillText('Tap or Enter', 65, 170);
  }

  function gameOver(){
    clearInterval(interval);
    recordScore(score);
    updateLeaderboard();
    drawGameOver();

    document.addEventListener('keydown', restartOnEnter, { once:true });
    screen.addEventListener('touchstart', restartOnTouch, { once:true });
  }

  function restartOnEnter(e){
    if(e.key === 'Enter') start();
  }
  function restartOnTouch(){
    start();
  }

  function start(){
    snake = [{ x: Math.floor(COLS/2), y: Math.floor(ROWS/2) }];
    dir = { x:1, y:0 };
    score = 0;
    speed = 150;
    pendingDir = null;
    scoreEl.textContent = score;

    apple = randomApple();
    drawBoard();

    clearInterval(interval);
    interval = setInterval(loop, speed);
  }

  // -------------------------------
  //        Controls
  // -------------------------------

  document.addEventListener('keydown', e => {
    switch(e.key){
      case 'ArrowUp':
      case 'w': case 'W':
        if(dir.y === 0) pendingDir = {x:0, y:-1};
        break;
      case 'ArrowDown':
      case 's': case 'S':
        if(dir.y === 0) pendingDir = {x:0, y:1};
        break;
      case 'ArrowLeft':
      case 'a': case 'A':
        if(dir.x === 0) pendingDir = {x:-1, y:0};
        break;
      case 'ArrowRight':
      case 'd': case 'D':
        if(dir.x === 0) pendingDir = {x:1, y:0};
        break;
    }
  });

  screen.addEventListener('touchstart', e=>{
    const r = screen.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - r.left;
    const y = t.clientY - r.top;

    const cx = r.width/2;
    const cy = r.height/2;
    const dx = x - cx;
    const dy = y - cy;

    let ndir = {...dir};
    if(Math.abs(dx) > Math.abs(dy)){
      ndir = dx < 0 ? {x:-1,y:0} : {x:1,y:0};
    } else {
      ndir = dy < 0 ? {x:0,y:-1} : {x:0,y:1};
    }

    if(!(ndir.x === -dir.x && ndir.y === -dir.y)){
      pendingDir = ndir;
    }
  });

  // Start up
  updateLeaderboard();
  start();

})();
