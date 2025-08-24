  /* ============= DATA ============= */
//   const ROUNDS = [
//     { prefix: "quả ch", suffix: "", answer: "anh",  choices: ["anh","ao","ua","inh"], image: "", word: "quả chanh" },
//     { prefix: "c", suffix: "", answer: "ua", choices: ["ua","oa","oe","ung"], image: "", word: "cua" },
//     { prefix: "qu", suffix: "", answer: "ả", choices: ["ả","ang","anh","ung"], image: "", word: "quả" },
//     { prefix: "c", suffix: "n", answer: "o", choices: ["o","oa","ui","oe"], image: "", word: "con" },
//     // add more …
//   ];

  const ROUNDS = [
    { 
        prefix: "quả ch", suffix: "", answer: "anh",
        choices: ["anh","ao","ua","inh"],
        image: "static/img/qua-chanh.png",   // 👈 add image here
        word: "quả chanh"
    },
    { 
        prefix: "c", suffix: "", answer: "ua",
        choices: ["ua","oa","oe","ung"],
        image: "static/img/cua.png",
        word: "cua"
    },
    { 
        prefix: "ch", suffix: "", answer: "ua",
        choices: ["ua","oe","ui","ung"],
        image: "static/img/chua.png",
        word: "chua"
    },
    { 
        prefix: "c", suffix: "n", answer: "o",
        choices: ["o","oa","ui","oe"],
        image: "static/img/con.png",
        word: "con"
    }
    ];

  // Optional: map full word -> audio url (or we will use TTS)
  const wordAudio = {
    // "quả chanh": "static/audio/qua-chanh.mp3"
  };

  /* ============= SIMPLE HUD (reused idea) ============= */
  function ensureHUD(){
    if(document.getElementById('hud')) return;
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.className = 'box';
    hud.style.display='flex'; hud.style.gap='1rem'; hud.style.alignItems='center'; hud.style.padding='8px 14px';
    hud.innerHTML = `
      <div>🏆 Điểm: <strong id="score">0</strong></div>
      <div>⭐ Liên tiếp: <strong id="streak">0</strong></div>
      <div>🏅 Kỷ lục: <strong id="best-streak">0</strong></div>
    `;
    const main = document.querySelector('main');
    const game = document.getElementById('game');
    main.insertBefore(hud, game);
  }

  let score=0, streak=0, bestStreak=Number(localStorage.getItem('hv_ghep_best')||0);
  function updateHUD(){
    (document.getElementById('score')||{}).textContent = String(score);
    (document.getElementById('streak')||{}).textContent = String(streak);
    (document.getElementById('best-streak')||{}).textContent = String(bestStreak);
  }

  /* ============= GAME STATE ============= */
  let currentIndex = -1;
  let currentRound = null;

  const promptEl = document.getElementById('prompt');
  const choicesEl = document.getElementById('choices');
  const feedbackEl = document.getElementById('feedback');
  const imgTag = document.getElementById('current-letter-img');

  /* ============= AUDIO HELPERS ============= */
  const audioCache = {};
  function speakText(text){
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN'; u.rate = 0.9;
    try{ speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{}
  }
  function playWord(){
    if(!currentRound) return;
    const w = currentRound.word || (currentRound.prefix + (currentRound.answer||'___') + currentRound.suffix);
    const src = wordAudio[w];
    if(src){
      if(!audioCache[w]){ const a = new Audio(src); a.preload='auto'; audioCache[w]=a; }
      audioCache[w].currentTime=0; audioCache[w].play().catch(()=>speakText(w));
    } else { speakText(w); }
  }

  /* ============= RENDER ============= */
  function renderPrompt(round, filled=null){
    const before = round.prefix || '';
    const after = round.suffix || '';
    const blankSpan = `<span class="drop-blank ${filled? 'filled':''}" data-drop="true">${filled ?? '____'}</span>`;
    promptEl.innerHTML = `${before}${blankSpan}${after}`;

    const drop = promptEl.querySelector('[data-drop]');
    // Drag-over events
    drop.addEventListener('dragover', (e)=>{ e.preventDefault(); });
    drop.addEventListener('drop', (e)=>{
      e.preventDefault();
      const data = e.dataTransfer.getData('text/plain');
      tryPlace(data);
    });
    // Click-to-fill for touch
    drop.addEventListener('click', ()=>{ /* no-op; cards handle insert */ });
  }

  function renderChoices(round){
    choicesEl.innerHTML = '';
    const shuffled = [...round.choices].sort(()=>Math.random()-0.5);
    shuffled.forEach((syll, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'syllable-card card scale-up';
      btn.textContent = syll;
      btn.draggable = true;
      btn.setAttribute('data-color', (idx%4)+1);
      btn.addEventListener('dragstart', (e)=>{
        e.dataTransfer.setData('text/plain', syll);
      });
      // tap-to-place
      btn.addEventListener('click', ()=> tryPlace(syll, btn));
      choicesEl.appendChild(btn);
    });
  }

  function tryPlace(syll, sourceBtn){
    if(!currentRound) return;
    const isCorrect = syll === currentRound.answer;
    const drop = promptEl.querySelector('[data-drop]');
    drop.classList.add('filled');
    drop.textContent = syll;

    if(isCorrect){
      feedbackEl.textContent = 'Đúng rồi!';
      feedbackEl.className = 'ok';
      score++; streak++; if(streak>bestStreak){ bestStreak=streak; localStorage.setItem('hv_ghep_best', String(bestStreak)); }
      updateHUD();
      if(sourceBtn){ sourceBtn.classList.add('correct'); }
      setTimeout(nextRound, 800);
      playWord();
    } else {
      feedbackEl.textContent = 'Chưa đúng rồi, thử lại nhé!';
      feedbackEl.className = 'no';
      streak=0; updateHUD();
      if(sourceBtn){ sourceBtn.classList.add('wrong'); setTimeout(()=>sourceBtn.classList.remove('wrong'), 400); }
      setTimeout(()=>{ drop.textContent='____'; drop.classList.remove('filled'); }, 600);
    }
  }

  function nextRound(){
    feedbackEl.textContent = '';
    currentIndex = (currentIndex + 1) % ROUNDS.length;
    currentRound = ROUNDS[currentIndex];

    // optional image per round
    if(currentRound.image){ 
        // imgTag.src = currentRound.image; 
        imgTag.src = "https://hoctiengviet.tforart.vn/wp-content/uploads/2025/08/37575451_8548196.jpg";
        imgTag.alt = 'gợi ý hình'; 
    }

    renderPrompt(currentRound);
    renderChoices(currentRound);

    // play word with blank as TTS hint (prefix ___ suffix)
    playWord();
  }

  /* ============= INIT ============= */
  ensureHUD(); updateHUD();
  document.getElementById('play-sound').addEventListener('click', playWord);
  nextRound();