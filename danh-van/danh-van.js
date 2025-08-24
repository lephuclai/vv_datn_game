/* ---------------- SYLLABLE LIST ---------------- */
const syllables = [
  "oa", "oe", "oi", "ua", "ue", "ui",
  "anh", "ach", "ang", "ong", "ung",
  "âu", "ây", "êu", "iêu", "yêu",
  "oi", "ôi", "ơi" // (note: "oi" appears twice in your list)
];

/* ---------------- AUDIO MAP ---------------- */
const audioMap = {
  "oa": "static/audio/oa.mp3",
  "oe": "static/audio/oe.mp3",
  "oi": "static/audio/oi.mp3",
  "ua": "static/audio/ua.mp3",
  "ue": "static/audio/ue.mp3",
  "ui": "static/audio/ui.mp3",
  "anh": "static/audio/anh.mp3",
  "ach": "static/audio/ach.mp3",
  "ang": "static/audio/ang.mp3",
  "ong": "static/audio/ong.mp3",
  "ung": "static/audio/ung.mp3",
  "âu": "static/audio/au.mp3",
  "ây": "static/audio/ay.mp3",
  "êu": "static/audio/eu.mp3",
  "iêu": "static/audio/ieu.mp3",
  "yêu": "static/audio/yeu.mp3",
  "ôi": "static/audio/oi-circumflex.mp3",
  "ơi": "static/audio/oi-horn.mp3"
};

/* ---------------- IMAGE MAP (optional) ---------------- */
const syllableImages = {
  "oa": "static/img/syllables/oa.png",
  "anh": "static/img/syllables/anh.png",
  "ui": "static/img/syllables/ui.png"
  // add more images for syllables
};

/* ---------------- CONSTANTS & ELEMENTS ---------------- */
const DEFAULT_IMG = "https://hoctiengviet.tforart.vn/wp-content/uploads/2025/08/37575451_8548196.jpg";

/* HUD helpers: create one if missing */
function ensureHUD() {
  if (document.getElementById("streak") && document.getElementById("best-streak") && document.getElementById("score")) return;

  const hud = document.createElement("div");
  hud.id = "hud";
  hud.style.display = "flex";
  hud.style.gap = "1rem";
  hud.style.alignItems = "center";
  hud.style.padding = "0.5rem 1rem";
  hud.style.margin = "0 0 10px 0";
  hud.style.background = "rgba(255,255,255,0.9)";
  hud.className = "box";

  hud.innerHTML = `
    <div class="hud-item"><span>🏆 Điểm:</span> <strong id="score">0</strong></div>
    <div class="hud-item"><span>⭐ Liên tiếp:</span> <strong id="streak">0</strong></div>
    <div class="hud-item"><span>🏅 Kỷ lục:</span> <strong id="best-streak">0</strong></div>
  `;

  const main = document.querySelector("main") || document.body;
  const game = document.getElementById("game");
  if (main && game) main.insertBefore(hud, game);
  else main.appendChild(hud);
}

/* ---------------- AUDIO PRELOAD ---------------- */
const audioCache = {};
function preloadAudio() {
  Object.entries(audioMap).forEach(([syllable, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    audioCache[syllable] = a;
  });
}

/* ---------------- TTS FALLBACK ---------------- */
function speakWithTTS(syllable) {
  const utt = new SpeechSynthesisUtterance(`${syllable}`);
  utt.lang = "vi-VN";
  utt.rate = 0.9;
  try { speechSynthesis.cancel(); speechSynthesis.speak(utt); } catch {}
}

/* ---------------- GAME STATE ---------------- */
let correctSyllable = "";
let score = 0;
let streak = 0;
let bestStreak = Number(localStorage.getItem("hv_bestStreak") || 0);

const imgTag = document.getElementById("current-letter-img");

/* Robust image setter with onerror fallback */
function setSyllableImage(syllable) {
  if (!imgTag) return;
  imgTag.onerror = null;
  const desired = syllableImages[syllable] || DEFAULT_IMG;

  imgTag.onerror = () => {
    if (imgTag.src !== DEFAULT_IMG) {
      imgTag.src = DEFAULT_IMG;
      imgTag.alt = "";
    }
  };

  imgTag.src = desired;
  imgTag.alt = (desired !== DEFAULT_IMG) ? `Hình vần ${syllable}` : "";
}

/* HUD update */
function updateHUD() {
  const s = document.getElementById("score");
  const st = document.getElementById("streak");
  const bs = document.getElementById("best-streak");
  if (s) s.textContent = String(score);
  if (st) st.textContent = String(streak);
  if (bs) bs.textContent = String(bestStreak);
}

/* ---------------- GAME LOGIC ---------------- */
function newQuestion() {
  correctSyllable = syllables[Math.floor(Math.random() * syllables.length)];

  // generate 3 wrong options
  let options = [correctSyllable];
  while (options.length < 4) {
    const rand = syllables[Math.floor(Math.random() * syllables.length)];
    if (!options.includes(rand)) options.push(rand);
  }

  // shuffle
  options.sort(() => Math.random() - 0.5);

  // show options in HTML
  options.forEach((syllable, i) => {
    const btn = document.getElementById(`option-${i+1}`);
    const choice = document.getElementById(`choice${i+1}`);
    if (!btn || !choice) return;

    choice.textContent = syllable;

    // reset button color
    const defaultColor = btn.id === "option-1" ? "#FF3859" :
                         btn.id === "option-2" ? "#44A5DC" :
                         btn.id === "option-3" ? "#FFC200" :
                         "#65BF3B";
    btn.style.backgroundColor = defaultColor;
    btn.classList.remove("correct","wrong");

    btn.onclick = () => checkAnswer(syllable, btn);
  });

  // update image
  setSyllableImage(correctSyllable);

  // play sound
  playSound();
}

function playSound() {
  const audio = audioCache[correctSyllable];
  if (audio && audio.src) {
    audio.currentTime = 0;
    audio.play().catch(() => speakWithTTS(correctSyllable));
  } else if (audioMap[correctSyllable]) {
    const a = new Audio(audioMap[correctSyllable]);
    audioCache[correctSyllable] = a;
    a.play().catch(() => speakWithTTS(correctSyllable));
  } else {
    speakWithTTS(correctSyllable);
  }
}

function checkAnswer(choice, btn) {
  if (choice === correctSyllable) {
    btn.style.backgroundColor = "green";

    // scoring
    score += 1;
    streak += 1;
    if (streak > bestStreak) {
      bestStreak = streak;
      localStorage.setItem("hv_bestStreak", String(bestStreak));
    }
    updateHUD();

    setTimeout(newQuestion, 800);
  } else {
    btn.style.backgroundColor = "red";

    // reset streak (score stays as total correct this session)
    streak = 0;
    updateHUD();

    setTimeout(() => {
      const defaultColor = btn.id === "option-1" ? "#FF3859" :
                           btn.id === "option-2" ? "#44A5DC" :
                           btn.id === "option-3" ? "#FFC200" :
                           "#65BF3B";
      btn.style.backgroundColor = defaultColor;
    }, 500);
  }
}

/* ---------------- INIT ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  ensureHUD();        // make sure #score, #streak, #best-streak exist
  updateHUD();        // initialize numbers

  // preload audio on first click (mobile-friendly)
  const prime = () => { preloadAudio(); document.removeEventListener("click", prime); };
  document.addEventListener("click", prime, { once: true });

  // setup play sound button
  const playBtn = document.getElementById("play-sound");
  if (playBtn) playBtn.onclick = () => playSound();

  // start
  newQuestion();
});
