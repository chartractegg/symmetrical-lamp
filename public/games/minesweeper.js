// ===========================
//     MINESWEEPER ENGINE
// ===========================

(function setupMinesweeper(){

  const boardEl   = document.getElementById('msBoard');
  const mineEl    = document.getElementById('msMineCount');
  const timerEl   = document.getElementById('msTimer');
  const resetBtn  = document.getElementById('msReset');
  const smiley    = document.getElementById('msSmiley');
  const diffSel   = document.getElementById('msDifficulty');
  const statusEl  = document.getElementById('msStatus');

  let R = 9, C = 9, M = 10;
  let grid = [];
  let firstClick = true;
  let alive = true;
  let running = false;
  let timer = 0;
  let timerHandle = null;
  let revealed = 0;
  let minesLeft = M;

  // Helpers
  function pad3(n){
    n = Math.max(0, Math.min(999, n));
    return String(n).padStart(3,'0');
  }

  function neighbors(r,c){
    const out=[];
    for(let dr=-1; dr<=1; dr++){
      for(let dc=-1; dc<=1; dc++){
        if(dr===0 && dc===0) continue;
        const nr=r+dr, nc=c+dc;
        if(nr>=0 && nr<R && nc>=0 && nc<C) out.push(grid[nr][nc]);
      }
    }
    return out;
  }

  function setDifficulty(str){
    const [rr, cc, mm] = str.split('x').map(Number);
    R = rr; C = cc; M = mm;
  }

  function newGrid(){
    boardEl.style.setProperty('--rows', R);
    boardEl.style.setProperty('--cols', C);
    boardEl.innerHTML = "";

    grid = [];

    for(let r=0; r<R; r++){
      const row = [];
      for(let c=0; c<C; c++){
        const cell = {
          r, c,
          mine:false,
          adj:0,
          revealed:false,
          flagged:false,
          el: document.createElement('div')
        };

        cell.el.className = "cell";
        cell.el.dataset.r = r;
        cell.el.dataset.c = c;
        cell.el.onmousedown = e => onMouseDown(e, cell);
        cell.el.oncontextmenu = e => e.preventDefault();
        cell.el.ondblclick = () => onChord(cell);

        boardEl.appendChild(cell.el);
        row.push(cell);
      }
      grid.push(row);
    }
  }

  function reset(){
    alive = true;
    firstClick = true;
    running = false;
    revealed = 0;

    clearInterval(timerHandle);
    timerHandle = null;
    timer = 0;

    timerEl.textContent = pad3(0);

    minesLeft = M;
    mineEl.textContent = pad3(minesLeft);

    smiley.textContent = '🙂';
    statusEl.textContent = '';

    newGrid();
  }

  function startTimer(){
    if(running) return;
    running = true;

    timerHandle = setInterval(()=>{
      timer++;
      timerEl.textContent = pad3(timer);
      if(timer >= 999){
        clearInterval(timerHandle);
      }
    }, 1000);
  }

  function placeMines(sr, sc){
    const forbid = new Set([`${sr},${sc}`]);
    neighbors(sr,sc).forEach(n => forbid.add(`${n.r},${n.c}`));

    let placed = 0;

    while(placed < M){
      const r = Math.floor(Math.random()*R);
      const c = Math.floor(Math.random()*C);
      const key = `${r},${c}`;
      if(forbid.has(key) || grid[r][c].mine) continue;
      grid[r][c].mine = true;
      placed++;
    }

    for(let r=0;r<R;r++){
      for(let c=0;c<C;c++){
        if(grid[r][c].mine) continue;
        grid[r][c].adj = neighbors(r,c).reduce((n,x)=>n+(x.mine?1:0),0);
      }
    }
  }

  function drawCell(cell){
    const el = cell.el;
    el.className = "cell" + (cell.revealed ? " revealed" : "");
    el.textContent = "";

    if(cell.revealed){
      if(cell.mine){
        el.classList.add("mine");
        el.textContent = "💣";
      } else if(cell.adj > 0){
        el.classList.add("n"+cell.adj);
        el.textContent = cell.adj;
      }
    } else if(cell.flagged){
      el.classList.add("flagged");
      el.textContent = "⚑";
    }
  }

  function reveal(cell){
    if(!alive) return;
    if(cell.revealed || cell.flagged) return;

    cell.revealed = true;
    revealed++;
    drawCell(cell);

    if(cell.mine){
      lose(cell);
      return;
    }

    if(cell.adj === 0){
      neighbors(cell.r, cell.c).forEach(reveal);
    }
  }

  function toggleFlag(cell){
    if(!alive || cell.revealed) return;

    cell.flagged = !cell.flagged;
    minesLeft += cell.flagged ? -1 : 1;
    mineEl.textContent = pad3(minesLeft);
    drawCell(cell);
  }

  function checkWin(){
    if(!alive) return;

    const safe = R*C - M;
    if(revealed >= safe){
      alive = false;
      running = false;

      clearInterval(timerHandle);
      smiley.textContent = '😎';
      statusEl.textContent = 'You win!';

      grid.flat().forEach(cell=>{
        if(cell.mine && !cell.flagged){
          cell.flagged = true;
          drawCell(cell);
        }
      });
    }
  }

  function lose(hit){
    alive = false;
    running = false;

    clearInterval(timerHandle);
    smiley.textContent = '😵';
    statusEl.textContent = 'Boom! Game over.';

    grid.flat().forEach(cell=>{
      if(cell.mine){
        cell.revealed = true;
        if(cell === hit) cell.el.style.background = "#ff9ea3";
      }
      drawCell(cell);
    });
  }

  function chord(cell){
    if(!cell.revealed || cell.adj === 0) return;
    const adj = neighbors(cell.r,cell.c);
    const flagged = adj.filter(n=>n.flagged).length;

    if(flagged === cell.adj){
      adj.forEach(n=>{
        if(!n.flagged && !n.revealed) reveal(n);
      });
      checkWin();
    }
  }

  function onMouseDown(e, cell){
    e.preventDefault();
    if(!alive) return;

    const isLeft  = (e.button === 0);
    const isRight = (e.button === 2);

    if(firstClick){
      placeMines(cell.r, cell.c);
      firstClick = false;
      startTimer();
    }

    if(isRight){
      toggleFlag(cell);
      checkWin();
    } else if(isLeft){
      if(cell.flagged) return;
      reveal(cell);
      checkWin();
    }
  }

  resetBtn.onclick = reset;
  diffSel.onchange = () => {
    setDifficulty(diffSel.value);
    reset();
  };

  setDifficulty(diffSel.value);
  reset();

})();
