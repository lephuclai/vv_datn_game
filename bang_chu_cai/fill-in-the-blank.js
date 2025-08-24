// ===== Vietnamese alphabet (29 letters) =====
const letters = [
  "a", "ă", "â",
  "b", "c", "d", "đ",
  "e", "ê",
  "g", "h", "i",
  "k", "l", "m", "n",
  "o", "ô", "ơ",
  "p", "q", "r", "s", "t",
  "u", "ư",
  "v", "x", "y"
];

// ===== Audio mapping =====
const audioMap = {
  "a": "static/audio/a.mp3",
  "ă": "static/audio/a-breve.mp3",
  "â": "static/audio/a-circumflex.mp3",
  "b": "static/audio/b.mp3",
  "c": "static/audio/c.mp3",
  "d": "static/audio/d.mp3",
  "đ": "static/audio/d-bar.mp3",
  "e": "static/audio/e.mp3",
  "ê": "static/audio/e-circumflex.mp3",
  "g": "static/audio/g.mp3",
  "h": "static/audio/h.mp3",
  "i": "static/audio/i.mp3",
  "k": "static/audio/k.mp3",
  "l": "static/audio/l.mp3",
  "m": "static/audio/m.mp3",
  "n": "static/audio/n.mp3",
  "o": "static/audio/o.mp3",
  "ô": "static/audio/o-circumflex.mp3",
  "ơ": "static/audio/o-horn.mp3",
  "p": "static/audio/p.mp3",
  "q": "static/audio/q.mp3",
  "r": "static/audio/r.mp3",
  "s": "static/audio/s.mp3",
  "t": "static/audio/t.mp3",
  "u": "static/audio/u.mp3",
  "ư": "static/audio/u-horn.mp3",
  "v": "static/audio/v.mp3",
  "x": "static/audio/x.mp3",
  "y": "static/audio/y.mp3"
};

const letterImages = {
  "a": "static/img/letters/a.png",
  "ă": "static/img/letters/a-breve.png",
  "â": "static/img/letters/a-circumflex.png",
  "b": "static/img/letters/b.png",
  "c": "static/img/letters/c.png",
  "d": "static/img/letters/d.png",
  "đ": "static/img/letters/d-bar.png",
  "e": "static/img/letters/e.png",
  "ê": "static/img/letters/e-circumflex.png",
  "g": "static/img/letters/g.png",
  "h": "static/img/letters/h.png",
  "i": "static/img/letters/i.png",
  "k": "static/img/letters/k.png",
  "l": "static/img/letters/l.png",
  "m": "static/img/letters/m.png",
  "n": "static/img/letters/n.png",
  "o": "static/img/letters/o.png",
  "ô": "static/img/letters/o-circumflex.png",
  "ơ": "static/img/letters/o-horn.png",
  "p": "static/img/letters/p.png",
  "q": "static/img/letters/q.png",
  "r": "static/img/letters/r.png",
  "s": "static/img/letters/s.png",
  "t": "static/img/letters/t.png",
  "u": "static/img/letters/u.png",
  "ư": "static/img/letters/u-horn.png",
  "v": "static/img/letters/v.png",
  "x": "static/img/letters/x.png",
  "y": "static/img/letters/y.png"
};

// ===== Preload audio (letters) =====
const audioCache = {};
function preloadAudio() {
  Object.entries(audioMap).forEach(([letter, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    audioCache[letter] = a;
  });
}

// ===== TTS fallback =====
function speakWithTTS(letter) {
  const utt = new SpeechSynthesisUtterance(`chữ ${letter}`);
  utt.lang = "vi-VN";
  utt.rate = 0.9;
  try { speechSynthesis.cancel(); speechSynthesis.speak(utt); } catch {}
}

// ===== Game state (no coins) =====
let correctLetter = "";
let score = 0;
let streak = 0;
let bestStreak = Number(localStorage.getItem("bestStreak") || 0);

// Elements
const imgTag = document.getElementById("current-letter-img");
const fxLayer = document.getElementById("fx-layer");
const sfxCorrect = document.getElementById("sfx-correct");
const sfxWrong   = document.getElementById("sfx-wrong");

// ===== HUD update (streak + best only) =====
function updateHUD() {
  const s = document.getElementById("score");
  const streakEl = document.getElementById("streak");
  const bestEl   = document.getElementById("best-streak");
  if (streakEl) streakEl.textContent = streak;
  if (bestEl)   bestEl.textContent = bestStreak;
  if (s) s.textContent = String(score);
}

// ===== Confetti =====
const COLORS = ["#FF3859","#44A5DC","#FFC200","#65BF3B","#9b59b6","#e67e22"];
const RMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
function confettiBurst(count = 36) {
  if (RMQ.matches || !fxLayer) return; // respect reduced motion/safe check
  const { innerWidth: w } = window;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = Math.random() * w + "px";
    piece.style.background = COLORS[Math.floor(Math.random()*COLORS.length)];
    piece.style.transform = `translateY(-20vh) rotate(${Math.random()*90}deg)`;
    piece.style.animationDuration = 600 + Math.random()*700 + "ms";
    fxLayer.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

// ===== Play audio with TTS fallback =====
function playSound() {
  const audio = audioCache[correctLetter];
  if (audio && audio.src) {
    audio.currentTime = 0;
    audio.play().catch(() => speakWithTTS(correctLetter));
  } else if (audioMap[correctLetter]) {
    const a = new Audio(audioMap[correctLetter]);
    audioCache[correctLetter] = a;
    a.play().catch(() => speakWithTTS(correctLetter));
  } else {
    speakWithTTS(correctLetter);
  }
}

// ===== Question generation =====
function newQuestion() {
  // choose answer
  correctLetter = letters[Math.floor(Math.random() * letters.length)];

  // Generate 3 wrong options
  let options = [correctLetter];
  while (options.length < 4) {
    let rand = letters[Math.floor(Math.random() * letters.length)];
    if (!options.includes(rand)) options.push(rand);
  }

  // Shuffle
  options.sort(() => Math.random() - 0.5);

  // Populate options + handlers
  options.forEach((letter, i) => {
    const btn = document.getElementById(`option-${i+1}`);
    const choice = document.getElementById(`choice${i+1}`);
    if (!btn || !choice) return;

    choice.textContent = letter;

    // Reset base color
    const defaultColor = btn.id === "option-1" ? "#FF3859" :
                         btn.id === "option-2" ? "#44A5DC" :
                         btn.id === "option-3" ? "#FFC200" :
                         "#65BF3B";
    btn.style.backgroundColor = defaultColor;
    btn.classList.remove("correct","wrong");

    btn.onclick = () => checkAnswer(letter, btn);
  });

  // ✅ Update image for the new letter (bugfix)
  if (letterImages[correctLetter]) {
    // imgTag.src = letterImages[correctLetter];
    imgTag.src = "https://hoctiengviet.tforart.vn/wp-content/uploads/2025/08/37575451_8548196.jpg";
    imgTag.alt = `Hình chữ ${correctLetter}`;
  } else {
    imgTag.src = "https://hoctiengviet.tforart.vn/wp-content/uploads/2025/08/37575451_8548196.jpg";
    imgTag.alt = "";
  }

  // Play sound once
  playSound();
}

// ===== Check answer with animations (no coin rewards) =====
function checkAnswer(choice, btn) {
  const isCorrect = (choice === correctLetter);

  if (isCorrect) {
    // Style + animation
    btn.classList.remove("wrong");
    btn.classList.add("correct");
    btn.style.backgroundColor = "#27ae60"; // green

    // Streak & best
    score += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);

    // Sound + confetti
    try { sfxCorrect && sfxCorrect.play(); } catch {}
    confettiBurst(28);

    // Milestone every 5 streak -> show reward card (no “xu”)
    if (streak % 5 === 0) {
      showRewardCard(`Bé vừa đạt ${streak} câu đúng liên tiếp! Bé thật giỏi!`);
    }

    // Persist only best streak
    localStorage.setItem("bestStreak", String(bestStreak));
    updateHUD();

    // Next question
    setTimeout(newQuestion, 800);
  } else {
    // Style + animation
    btn.classList.remove("correct");
    btn.classList.add("wrong");
    btn.style.backgroundColor = "#c0392b"; // red

    // Sound
    try { sfxWrong && sfxWrong.play(); } catch {}

    // Reset streak
    streak = 0;
    updateHUD();

    // Briefly flash then restore color
    setTimeout(() => {
      const defaultColor = btn.id === "option-1" ? "#FF3859" :
                           btn.id === "option-2" ? "#44A5DC" :
                           btn.id === "option-3" ? "#FFC200" :
                           "#65BF3B";
      btn.style.backgroundColor = defaultColor;
    }, 500);
  }
}

// ===== Reward modal =====
function showRewardCard(message) {
  const card = document.getElementById("reward-card");
  const text = document.getElementById("reward-text");
  if (!card || !text) return;
  text.textContent = message;
  card.hidden = false;
}

const rewardCloseBtn = document.getElementById("reward-close");
if (rewardCloseBtn) {
  rewardCloseBtn.addEventListener("click", () => {
    const card = document.getElementById("reward-card");
    if (card) card.hidden = true;
  });
}

// ===== Buttons =====
const playSoundBtn = document.getElementById("play-sound");
if (playSoundBtn) {
  playSoundBtn.addEventListener("click", playSound);
}

// ===== Init =====
window.addEventListener("DOMContentLoaded", () => {
  preloadAudio();
  updateHUD();
  newQuestion();
});
