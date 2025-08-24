  /* ================== DATA ================== */
  // Each item represents a word with an image and its target syllable (vần)
  // Provide your own images in static/img/words/ ...
  const POOL = [
    { id:'chanh', word:'quả chanh', van:'anh', image:'static/img/words/chanh.png' },
    { id:'cua',   word:'cua',       van:'ua',  image:'static/img/words/cua.png' },
    { id:'com',   word:'cơm',       van:'o',   image:'static/img/words/com.png' },
    { id:'bong',  word:'bóng',      van:'ong', image:'bong.jpg' },
    { id:'may',   word:'mây',       van:'ay',  image:'static/img/words/may.png' },
    { id:'yeu',   word:'yêu',       van:'yêu', image:'static/img/words/yeu.png' },
    { id:'nhung', word:'nhung',     van:'ung', image:'static/img/words/nhung.png' },
    { id:'dieu',  word:'diều',      van:'iêu', image:'static/img/words/dieu.png' }
  ];

  // Optional recorded audio for whole words; TTS fallback if not provided
  const wordAudio = {
    // 'quả chanh': 'static/audio/qua-chanh.mp3'
  };

  // How many pairs per round
  const PAIRS_PER_ROUND = 6;

  /* ================== HUD ================== */
  function ensureHUD(){
    if(document.getElementById('hud')) return;
    const hud = document.createElement('div');
    hud.id='hud'; hud.className='box';
    hud.style.display='flex'; hud.style.gap='1rem'; hud.style.alignItems='center'; hud.style.padding='8px 14px';
    hud.innerHTML = `
      <div>🏆 Điểm: <strong id="score">0</strong></div>
      <div>⭐ Liên tiếp: <strong id="streak">0</strong></div>
      <div>🏅 Kỷ lục: <strong id="best-streak">0</strong></div>
    `;
    const main=document.querySelector('main'); const game=document.getElementById('game');
    main.insertBefore(hud, game);
  }
  let score=0, streak=0, bestStreak=Number(localStorage.getItem('hv_match_best')||0);
  function updateHUD(){
    const s=document.getElementById('score'); if(s) s.textContent=String(score);
    const st=document.getElementById('streak'); if(st) st.textContent=String(streak);
    const bs=document.getElementById('best-streak'); if(bs) bs.textContent=String(bestStreak);
  }

  /* ================== AUDIO ================== */
  const audioCache={};
  function speak(text){ const u=new SpeechSynthesisUtterance(text); u.lang='vi-VN'; u.rate=0.9; try{speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }
  function playWord(text){
    const src = wordAudio[text];
    if(src){ if(!audioCache[text]){ const a=new Audio(src); a.preload='auto'; audioCache[text]=a; }
      audioCache[text].currentTime=0; audioCache[text].play().catch(()=>speak(text));
    } else { speak(text); }
  }

  /* ================== GAME STATE ================== */
  let currentPairs=[]; // selected pair objects
  let leftCards=[]; let rightCards=[]; // DOM refs
  let selectedLeft=null; let selectedRight=null;
  let matchedCount=0;

  const feedbackEl=document.getElementById('feedback');
  const leftCol=document.getElementById('left');
  const rightCol=document.getElementById('right');

  function pickRandomPairs(n){
    const copy=[...POOL];
    copy.sort(()=>Math.random()-0.5);
    return copy.slice(0, Math.min(n, copy.length));
  }

  function buildBoard(){
    leftCol.innerHTML=''; rightCol.innerHTML='';
    leftCards=[]; rightCards=[]; matchedCount=0; selectedLeft=null; selectedRight=null; feedbackEl.textContent='';

    // Left: IMAGES (shuffled)
    const left = [...currentPairs].sort(()=>Math.random()-0.5);
    left.forEach(item=>{
      const card=document.createElement('div'); card.className='card selectable'; card.dataset.id=item.id; card.dataset.type='left';
      const img=new Image(); img.alt=item.word; img.src=item.image || 'https://hoctiengviet.tforart.vn/wp-content/uploads/2025/08/37575451_8548196.jpg';
      img.loading='lazy'; card.appendChild(img);
      card.addEventListener('click', ()=>onSelect(card));
      leftCol.appendChild(card); leftCards.push(card);
    });

    // Right: SYLLABLES (shuffled)
    const right = [...currentPairs].sort(()=>Math.random()-0.5);
    right.forEach((item, idx)=>{
      const btn=document.createElement('div'); btn.className='card word-card selectable'; btn.textContent=item.van; btn.dataset.id=item.id; btn.dataset.type='right';
      btn.style.background = idx%4===0?'#FFEEF3': idx%4===1?'#EEF7FF': idx%4===2?'#FFF9E6':'#EEFFE9';
      btn.addEventListener('click', ()=>onSelect(btn));
      rightCol.appendChild(btn); rightCards.push(btn);
    });
  }

  function onSelect(card){
    if(card.classList.contains('correct')) return; // already matched

    const side=card.dataset.type;
    if(side==='left'){
      if(selectedLeft) selectedLeft.classList.remove('selected');
      selectedLeft=card; card.classList.add('selected');
      if(selectedRight) checkMatch();
      else { // play hint: say the word with blank
        const item = currentPairs.find(p=>p.id===card.dataset.id); if(item) speak(`${item.word.replace(item.van, '___')}`);
      }
    } else { // right
      if(selectedRight) selectedRight.classList.remove('selected');
      selectedRight=card; card.classList.add('selected');
      if(selectedLeft) checkMatch();
      else speak(card.textContent);
    }
  }

  function checkMatch(){
    const leftId=selectedLeft.dataset.id; const rightId=selectedRight.dataset.id;
    const leftItem=currentPairs.find(p=>p.id===leftId); const rightItem=currentPairs.find(p=>p.id===rightId);
    const isCorrect = leftId===rightId;

    if(isCorrect){
      // lock them
      selectedLeft.classList.remove('selected'); selectedRight.classList.remove('selected');
      selectedLeft.classList.add('correct'); selectedRight.classList.add('correct');
      matchedCount++; score++; streak++; if(streak>bestStreak){bestStreak=streak; localStorage.setItem('hv_match_best', String(bestStreak));}
      updateHUD();
      feedbackEl.textContent = 'Giỏi quá! Đúng rồi!'; feedbackEl.className='ok';
      playWord(leftItem.word);
      selectedLeft=null; selectedRight=null;
      if(matchedCount===currentPairs.length){ setTimeout(nextRound, 900); }
    } else {
      // tiny shake + reset selection
      selectedLeft.classList.add('wrong'); selectedRight.classList.add('wrong');
      setTimeout(()=>{ selectedLeft.classList.remove('wrong','selected'); selectedRight.classList.remove('wrong','selected'); selectedLeft=null; selectedRight=null; }, 350);
      streak=0; updateHUD(); feedbackEl.textContent='Chưa đúng, thử lại nhé!'; feedbackEl.className='no';
    }
  }

  function nextRound(){
    feedbackEl.textContent='';
    currentPairs = pickRandomPairs(PAIRS_PER_ROUND);
    buildBoard();
  }

  // init
  ensureHUD(); updateHUD();
  document.getElementById('play-sound').addEventListener('click', ()=>{
    // If left selected, play its full word; otherwise read a random one for fun
    if(selectedLeft){ const item=currentPairs.find(p=>p.id===selectedLeft.dataset.id); if(item) playWord(item.word); }
    else if(currentPairs[0]) playWord(currentPairs[0].word);
  });
  nextRound();