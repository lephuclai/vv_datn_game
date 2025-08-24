/* ---------- DATA ---------- */
const LETTERS = ["a","ă","â","b","c","d","đ","e","ê","g","h","i","k","l","m","n","o","ô","ơ","p","q","r","s","t","u","ư","v","x","y"];
const VANS = ["oa","oe","oi","ua","ue","ui","anh","ach","ang","ong","ung","âu","ây","êu","iêu","yêu","ôi","ơi"];
const audioMap = {}; // add files if you want; TTS fallback

/* ---------- CONFIG ---------- */
const STEPS_TO_WIN = 10;
const QUESTION_TIME_MS = 30000; // 30s timer

/* ---------- STATE ---------- */
let mode = "letters";
let answer = "";
let youSteps = 0, botSteps = 0;
let score = 0, streak = 0, bestStreak = Number(localStorage.getItem("hv_race_best")||0);

// timer handles
let timerId = null, tickId = null, timeLeftMs = QUESTION_TIME_MS;

const promptEl  = document.getElementById("prompt");
const choicesEl = document.getElementById("choices");
const feedbackEl= document.getElementById("feedback");
const carYou    = document.getElementById("car-you");
const carBot    = document.getElementById("car-bot");
const playBtn   = document.getElementById("play-sound");
const modeSel   = document.getElementById("mode-select");
const timerText = document.getElementById("timer-text");
const timerBar  = document.getElementById("timer-bar");
const restartDiv= document.getElementById("restart");
const restartBtn= document.getElementById("restart-btn");

function updateHUD(){
document.getElementById("score").textContent = String(score);
document.getElementById("streak").textContent = String(streak);
document.getElementById("best-streak").textContent = String(bestStreak);
}

/* ---------- AUDIO ---------- */
const audioCache = {};
function speakVI(text){ const u=new SpeechSynthesisUtterance(text); u.lang="vi-VN"; u.rate=0.9; try{speechSynthesis.cancel(); speechSynthesis.speak(u);}catch{} }
function playSoundFor(token){
const src = audioMap[token];
if(src){
    if(!audioCache[token]){ const a=new Audio(src); a.preload="auto"; audioCache[token]=a; }
    audioCache[token].currentTime=0;
    audioCache[token].play().catch(()=>speakVI(token));
} else {
    if(mode==="letters") speakVI(`chữ ${token}`); else speakVI(token);
}
}

/* ---------- RACE ---------- */
function setCarPositions(){
const pctYou = Math.min(youSteps / STEPS_TO_WIN, 1);
const pctBot = Math.min(botSteps / STEPS_TO_WIN, 1);
const trackWidth = document.querySelector(".lane").clientWidth;
const flagW = 46, padding = 18, usable = trackWidth - flagW - padding - 52;
carYou.style.left = (padding + usable * pctYou) + "px";
carBot.style.left = (padding + usable * pctBot) + "px";
}
function resetRace(){ youSteps=0; botSteps=0; setCarPositions(); }

function endGame(playerWon){
clearTimers();
if(playerWon){
    feedbackEl.textContent = "🏁 Bé chiến thắng! Tuyệt vời!";
    feedbackEl.className = "ok";
    streak++; score++; if(streak>bestStreak){ bestStreak=streak; localStorage.setItem("hv_race_best", String(bestStreak)); }
}else{
    feedbackEl.textContent = "Bạn về đích trước rồi! Bé thử lại nhé!";
    feedbackEl.className = "no";
    streak = 0;
}
updateHUD();
restartDiv.style.display = "block";
}

function checkWin(){
if(youSteps >= STEPS_TO_WIN){ endGame(true); return true; }
if(botSteps >= STEPS_TO_WIN){ endGame(false); return true; }
return false;
}

/* ---------- TIMER ---------- */
function clearTimers(){
if(timerId){ clearTimeout(timerId); timerId=null; }
if(tickId){ clearInterval(tickId); tickId=null; }
}
function startTimer(){
clearTimers();
timeLeftMs = QUESTION_TIME_MS;
timerText.textContent = Math.ceil(timeLeftMs/1000) + "s";
timerBar.style.width = "100%";

tickId = setInterval(()=>{
    timeLeftMs = Math.max(timeLeftMs - 250, 0);
    timerText.textContent = Math.ceil(timeLeftMs/1000) + "s";
    timerBar.style.width = (timeLeftMs / QUESTION_TIME_MS * 100) + "%";
}, 250);

timerId = setTimeout(()=>{
    // time out → bot advances 1 step, same question stays, timer restarts
    botSteps = Math.min(botSteps + 1, STEPS_TO_WIN);
    setCarPositions();
    if(!checkWin()){
    // restart timer for the SAME question
    startTimer();
    }
}, QUESTION_TIME_MS);
}

/* ---------- QUESTIONS ---------- */
function pickArray(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled(arr){ return [...arr].sort(()=>Math.random()-0.5); }

function newQuestion(){
restartDiv.style.display = "none";
feedbackEl.textContent = "";
feedbackEl.className = "";

const bank = (mode === "letters") ? LETTERS : VANS;
answer = pickArray(bank);

const opts = new Set([answer]);
while(opts.size < 4){ opts.add(pickArray(bank)); }
const options = shuffled([...opts]);

choicesEl.innerHTML = "";
options.forEach((opt, i)=>{
    const btn = document.createElement("button");
    btn.className = `opt c${(i%4)+1}`;
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt, btn);
    choicesEl.appendChild(btn);
});

playSoundFor(answer);
startTimer(); // ⏱️ start/restart 30s countdown for this question
}

function onCorrect(){
clearTimers();
feedbackEl.textContent = "Đúng rồi! Xe chạy tiếp nào!";
feedbackEl.className = "ok";
youSteps = Math.min(youSteps + 1, STEPS_TO_WIN);
setCarPositions();
playSoundFor(answer);
if(!checkWin()){ setTimeout(newQuestion, 600); }
}

function onWrong(btn){
// Opponent advances immediately on wrong answer
feedbackEl.textContent = "Chưa đúng, đối thủ đi tiếp!";
feedbackEl.className = "no";
streak = 0; updateHUD();

botSteps = Math.min(botSteps + 1, STEPS_TO_WIN);
setCarPositions();
btn.style.transform = "translateY(0) scale(0.96)";
setTimeout(()=>btn.style.transform="", 150);

// Keep the SAME question; timer continues (don’t restart)
checkWin();
}

function checkAnswer(opt, btn){
if(opt === answer) onCorrect();
else onWrong(btn);
}

/* ---------- INIT ---------- */
function init(){
updateHUD();
playBtn.addEventListener("click", ()=> playSoundFor(answer));
modeSel.addEventListener("change", (e)=>{ mode=e.target.value; resetRace(); newQuestion(); });
restartBtn.addEventListener("click", ()=>{
    // restart race; keep mode; keep score/streak as-is (change if you want)
    resetRace(); newQuestion();
});

// Prime on first gesture (mobile)
const prime = ()=>{ document.removeEventListener("click", prime); };
document.addEventListener("click", prime, { once:true });

resetRace();
newQuestion();
}
window.addEventListener("DOMContentLoaded", init);