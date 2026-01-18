/* Temple Quest — simple GitHub Pages vocab game (no libraries needed) */

const VOCAB = [
  { fr: ["la sixième", "sixieme"], en: ["Year 7"] },
  { fr: ["la cinquième", "cinquieme"], en: ["Year 8"] },
  { fr: ["la quatrième", "quatrieme"], en: ["Year 9"] },
  { fr: ["la troisième", "troisieme"], en: ["Year 10"] },

  { fr: ["une classe"], en: ["class"] },
  { fr: ["un collège", "un college"], en: ["secondary school"] },
  { fr: ["le copain"], en: ["friend", "mate"] },

  // Accept both genders for élève
  { fr: ["un élève", "un eleve", "une élève", "une eleve"], en: ["pupil", "student"] },

  { fr: ["un kilomètre", "un kilometre"], en: ["kilometre", "kilometer"] },
  { fr: ["une matière", "une matiere"], en: ["subject"] },
  { fr: ["un prof", "une prof", "un professeur", "une professeure", "prof"], en: ["teacher"] },
  { fr: ["une salle de classe", "une salle (de classe)", "une salle"], en: ["classroom", "(class)room", "class room"] },

  { fr: ["j'habite", "jhabite"], en: ["I live"] },
  { fr: ["dans"], en: ["in"] },
  { fr: ["un appartement"], en: ["flat", "apartment"] },
  { fr: ["une chambre"], en: ["bedroom"] },
  { fr: ["une maison individuelle"], en: ["detached house"] },
  { fr: ["une maison jumelée", "une maison jumelee"], en: ["semi-detached house", "semi detached house"] },
  { fr: ["un pavillon"], en: ["bungalow"] },
  { fr: ["en banlieue"], en: ["in the suburbs", "in suburbs"] },
  { fr: ["à la campagne", "a la campagne"], en: ["in the countryside"] },
  { fr: ["à la montagne", "a la montagne"], en: ["in the mountains"] },
  { fr: ["dans un village"], en: ["in a village"] },
  { fr: ["en ville"], en: ["in town"] },
];

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function normalize(str) {
  return (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ---------- sound (Web Audio, no files needed) ----------
let audioCtx = null;
let soundOn = true;
let ambienceOn = false;
let ambienceNode = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function beep(type) {
  if (!soundOn) return;
  ensureAudio();
  const t = audioCtx.currentTime;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);

  if (type === "good") {
    o.type = "triangle";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);
  } else {
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  }

  o.start(t);
  o.stop(t + 0.24);
}

function toggleAmbience() {
  ambienceOn = !ambienceOn;
  $("ambienceBtn").setAttribute("aria-pressed", String(ambienceOn));
  $("ambienceBtn").textContent = ambienceOn ? "🏛️ Ambience: ON" : "🏛️ Ambience";

  if (!ambienceOn) {
    if (ambienceNode) {
      ambienceNode.stop();
      ambienceNode.disconnect();
      ambienceNode = null;
    }
    return;
  }

  // Create soft “temple wind” noise
  ensureAudio();
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const white = audioCtx.createBufferSource();
  white.buffer = noiseBuffer;
  white.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;

  const g = audioCtx.createGain();
  g.gain.value = 0.05;

  white.connect(filter);
  filter.connect(g);
  g.connect(audioCtx.destination);

  white.start();
  ambienceNode = white;
}

// ---------- confetti FX ----------
const fx = $("fx");
const ctx = fx.getContext("2d");
let particles = [];

function resizeFX() {
  fx.width = window.innerWidth * devicePixelRatio;
  fx.height = window.innerHeight * devicePixelRatio;
}
window.addEventListener("resize", resizeFX);
resizeFX();

function burst() {
  const n = 90;
  for (let i = 0; i < n; i++) {
    particles.push({
      x: (window.innerWidth * devicePixelRatio) * (0.35 + Math.random() * 0.3),
      y: (window.innerHeight * devicePixelRatio) * (0.25 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 10 * devicePixelRatio,
      vy: (Math.random() - 1.1) * 12 * devicePixelRatio,
      r: (2 + Math.random() * 4) * devicePixelRatio,
      life: 70 + Math.random() * 30
    });
  }
}

function tickFX() {
  ctx.clearRect(0, 0, fx.width, fx.height);
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.life -= 1;
    p.vy += 0.22 * devicePixelRatio;
    p.x += p.vx;
    p.y += p.vy;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(tickFX);
}
tickFX();

// ---------- game state ----------
const ROOMS = ["Atrium", "Column Hall", "Blueprint Studio", "Set Workshop", "Oracle Stage", "Boss Gate"];
let mode = "EF"; // EF: English -> French, FE: French -> English
let difficulty = "normal";
let order = [];
let idx = 0;

let score = 0;
let streak = 0;
let correct = 0;
let wrong = 0;

let timerSeconds = 0;
let timeLeft = 0;
let timerId = null;

// ---------- storage ----------
const KEY = "templeQuestStats_v1";
function loadStats() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function saveStats(stats) {
  localStorage.setItem(KEY, JSON.stringify(stats));
}

function updateScroll() {
  const stats = loadStats();
  $("bestStreak").textContent = stats.bestStreak || 0;
  $("bestScore").textContent = stats.bestScore || 0;
  $("totalCorrect").textContent = stats.totalCorrect || 0;
}

function commitStats() {
  const stats = loadStats();
  stats.bestStreak = Math.max(stats.bestStreak || 0, streak);
  stats.bestScore = Math.max(stats.bestScore || 0, score);
  stats.totalCorrect = (stats.totalCorrect || 0) + 1;
  saveStats(stats);
  updateScroll();
}

// ---------- UI ----------
function setFeedback(text, kind) {
  const el = $("feedback");
  el.textContent = text;
  el.className = "feedback" + (kind ? " " + kind : "");
}

function renderStats() {
  $("score").textContent = score;
  $("streak").textContent = streak;
  $("correct").textContent = correct;
  $("wrong").textContent = wrong;
  $("time").textContent = timerSeconds ? `${timeLeft}s` : "—";
}

function renderVocabList() {
  const box = $("vocabList");
  box.innerHTML = "";
  VOCAB.forEach(v => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<div class="f">${v.fr[0]}</div><div class="e">${v.en[0]}</div>`;
    box.appendChild(div);
  });
}

function currentCard() {
  return order[idx];
}

function getPromptAndAnswers(card) {
  if (mode === "EF") {
    return {
      prompt: pick(card.en),
      answers: card.fr
    };
  } else {
    return {
      prompt: pick(card.fr),
      answers: card.en
    };
  }
}

function renderPrompt() {
  const room = ROOMS[Math.min(Math.floor((correct + wrong) / 4), ROOMS.length - 1)];
  $("roomName").textContent = room;

  $("promptDir").textContent = mode === "EF" ? "English ➜ French" : "French ➜ English";
  const { prompt } = getPromptAndAnswers(currentCard());
  $("prompt").textContent = prompt;

  $("answer").value = "";
  $("answer").focus();
}

function startRound() {
  // build order (Boss Rush = fewer repeats, more random)
  const base = VOCAB.slice();
  order = shuffle(base);

  idx = 0;
  score = 0;
  streak = 0;
  correct = 0;
  wrong = 0;

  setFeedback("Step into the temple. Type the answer and press Enter.", "");
  stopTimer();
  setupTimerFromUI();

  renderStats();
  renderPrompt();
}

function nextCard() {
  idx += 1;
  if (idx >= order.length) {
    // loop again
    order = shuffle(order);
    idx = 0;
  }
  renderPrompt();
}

function isCorrect(input, accepted) {
  const n = normalize(input);

  // allow minor punctuation differences, extra brackets, etc.
  const n2 = n.replace(/[()]/g, "").trim();

  return accepted.some(a => {
    const na = normalize(a).replace(/[()]/g, "").trim();
    return n2 === na;
  });
}

function hintFor(card) {
  const { answers } = getPromptAndAnswers(card);
  const target = answers[0];
  // reveal first 35% of characters (but keep spaces)
  const raw = target;
  const revealCount = Math.max(2, Math.floor(raw.length * 0.35));
  let shown = "";
  let letters = 0;
  for (const ch of raw) {
    if (ch === " ") shown += " ";
    else if (letters < revealCount) { shown += ch; letters++; }
    else shown += "•";
  }
  return shown;
}

// ---------- timer ----------
function setupTimerFromUI() {
  timerSeconds = Number($("timerSelect").value);
  if (!timerSeconds) {
    timeLeft = 0;
    renderStats();
    return;
  }
  timeLeft = timerSeconds;
  renderStats();
  timerId = setInterval(() => {
    timeLeft -= 1;
    renderStats();
    if (timeLeft <= 0) endRun();
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function endRun() {
  stopTimer();
  setFeedback(`⏳ Time! Final score: ${score}. Streak: ${streak}. Want another run? Hit Shuffle.`, "");
  beep("bad");
}

// ---------- events ----------
$("answerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("answer").value;

  const card = currentCard();
  const { answers } = getPromptAndAnswers(card);

  if (isCorrect(input, answers)) {
    correct += 1;
    streak += 1;

    const bonus = difficulty === "boss" ? 14 : 10;
    score += bonus + Math.min(10, streak);

    setFeedback(`✅ Correct! +${bonus} (streak bonus +${Math.min(10, streak)})`, "good");
    beep("good");

    if (streak % 5 === 0) burst();
    commitStats();
    renderStats();
    nextCard();
  } else {
    wrong += 1;
    streak = 0;
    score = Math.max(0, score - 4);

    setFeedback(`❌ Not quite. Accepted: ${answers[0]}`, "bad");
    beep("bad");
    renderStats();

    // In Boss Rush, wrong answers move on quickly
    if (difficulty === "boss") nextCard();
  }
});

$("hintBtn").addEventListener("click", () => {
  const card = currentCard();
  setFeedback(`✨ Hint: ${hintFor(card)}`, "");
  if (soundOn) beep("good");
});

$("revealBtn").addEventListener("click", () => {
  const card = currentCard();
  const { answers } = getPromptAndAnswers(card);
  setFeedback(`👁 Re
