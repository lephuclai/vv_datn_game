// Full Vietnamese alphabet (29 letters)
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

/**
 * AUDIO SETUP
 * Put your audio files in /audio and update the mapping below.
 */
const audioMap = {
  "a": "audio/a.mp3",
  "ă": "audio/a-breve.mp3",
  "â": "audio/a-circumflex.mp3",
  "b": "audio/b.mp3",
  "c": "audio/c.mp3",
  "d": "audio/d.mp3",
  "đ": "audio/d-bar.mp3",
  "e": "audio/e.mp3",
  "ê": "audio/e-circumflex.mp3",
  "g": "audio/g.mp3",
  "h": "audio/h.mp3",
  "i": "audio/i.mp3",
  "k": "audio/k.mp3",
  "l": "audio/l.mp3",
  "m": "audio/m.mp3",
  "n": "audio/n.mp3",
  "o": "audio/o.mp3",
  "ô": "audio/o-circumflex.mp3",
  "ơ": "audio/o-horn.mp3",
  "p": "audio/p.mp3",
  "q": "audio/q.mp3",
  "r": "audio/r.mp3",
  "s": "audio/s.mp3",
  "t": "audio/t.mp3",
  "u": "audio/u.mp3",
  "ư": "audio/u-horn.mp3",
  "v": "audio/v.mp3",
  "x": "audio/x.mp3",
  "y": "audio/y.mp3"
};

// Preload audio
const audioCache = {};
function preloadAudio() {
  Object.entries(audioMap).forEach(([letter, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    audioCache[letter] = a;
  });
}

// Fallback TTS (slower + repeated phrase)
function speakWithTTS(letter) {
  const utt = new SpeechSynthesisUtterance(`chữ ${letter}`);
  utt.lang = "vi-VN";
  utt.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
}

/* ---------------- GAME LOGIC ---------------- */

let correctLetter = "";

function newQuestion() {
  document.getElementById("message").textContent = "";

  correctLetter = letters[Math.floor(Math.random() * letters.length)];

  // Generate 3 wrong answers
  let options = [correctLetter];
  while (options.length < 4) {
    let rand = letters[Math.floor(Math.random() * letters.length)];
    if (!options.includes(rand)) options.push(rand);
  }

  // Shuffle answers
  options.sort(() => Math.random() - 0.5);

  // Show answers
  const answerDiv = document.getElementById("answers");
  answerDiv.innerHTML = "";
  options.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.onclick = () => checkAnswer(letter);
    answerDiv.appendChild(btn);
  });
}

function playSound() {
  const audio = audioCache[correctLetter];
  if (audio && audio.src) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      speakWithTTS(correctLetter);
    });
  } else if (audioMap[correctLetter]) {
    const a = new Audio(audioMap[correctLetter]);
    audioCache[correctLetter] = a;
    a.play().catch(() => speakWithTTS(correctLetter));
  } else {
    speakWithTTS(correctLetter);
  }
}

function checkAnswer(choice) {
  if (choice === correctLetter) {
    document.getElementById("message").textContent = "✅ Chính xác!";
    setTimeout(newQuestion, 1200);
  } else {
    document.getElementById("message").textContent = "❌ Sai rồi, thử lại!";
  }
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  const prime = () => {
    preloadAudio();
    document.removeEventListener("click", prime);
  };
  document.addEventListener("click", prime, { once: true });

  newQuestion();
});
