// WebTuner – Guitar & Bass
// Author: Luca Bocaletto
// License: MIT

// ---------- Constants ----------
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const GUITAR_STRINGS = [
  {name:"E4", freq:329.628}, {name:"B3", freq:246.942}, {name:"G3", freq:196.000},
  {name:"D3", freq:146.832}, {name:"A2", freq:110.000}, {name:"E2", freq:82.407}
];
const BASS_STRINGS = [
  {name:"G2", freq:98.000}, {name:"D2", freq:73.416}, {name:"A1", freq:55.000}, {name:"E1", freq:41.203}
];

// ---------- State ----------
let audioCtx, analyser, micSource;
let rafId = null;
let isRunning = false;
let timeData;
let a4 = 440;

// ---------- UI refs ----------
const modeEl = document.getElementById("mode");
const a4El = document.getElementById("a4");
const a4ValEl = document.getElementById("a4v");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const noteEl = document.getElementById("note");
const octEl = document.getElementById("oct");
const freqEl = document.getElementById("freq");
const centsEl = document.getElementById("cents");
const needleEl = document.getElementById("needle");
const stringsEl = document.getElementById("strings");

// ---------- Helpers ----------
function freqToNote(f, A4=440){
  const n = Math.round(12 * Math.log2(f / A4) + 69);
  const name = NOTE_NAMES[n % 12];
  const oct = Math.floor(n / 12) - 1;
  const ref = A4 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(f / ref);
  return { n, name, oct, ref, cents };
}

function setNeedle(cents){
  const clamped = Math.max(-50, Math.min(50, cents));
  const pos = (clamped + 50) / 100 * 100;
  needleEl.style.left = pos + "%";
  centsEl.textContent = cents.toFixed(0);
  if (Math.abs(cents) <= 5){
    centsEl.classList.add("good"); centsEl.classList.remove("warn");
  } else if (Math.abs(cents) > 20){
    centsEl.classList.add("warn"); centsEl.classList.remove("good");
  } else {
    centsEl.classList.remove("good","warn");
  }
}

function renderStrings(){
  stringsEl.innerHTML = "";
  const set = modeEl.value === "bass" ? BASS_STRINGS
            : modeEl.value === "guitar" ? GUITAR_STRINGS
            : [];
  set.forEach(s=>{
    const b = document.createElement("button");
    b.textContent = `${s.name} • ${s.freq.toFixed(2)} Hz`;
    b.addEventListener("click", ()=>playTone(s.freq, 2.0));
    stringsEl.appendChild(b);
  });
  if (set.length===0){
    const span = document.createElement("div");
    span.className="legend";
    span.textContent = "Chromatic mode: no fixed strings. Use automatic detection.";
    stringsEl.appendChild(span);
  }
}

function playTone(freq, seconds=1.5){
  const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  osc.start();
  gain.gain.setTargetAtTime(0.0001, now + seconds, 0.05);
  osc.stop(now + seconds + 0.1);
}

// ---------- Auto-correlation Pitch Detection ----------
function autoCorrelate(buf, sampleRate){
  const SIZE = buf.length;
  let rms = 0;
  for (let i=0;i<SIZE;i++){ const v=buf[i]; rms += v*v; }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // too quiet

  const CLIP = 0.01;
  const clipped = new Float32Array(SIZE);
  for (let i=0;i<SIZE;i++){
    const v = buf[i];
    clipped[i] = Math.abs(v) >= CLIP ? v : 0;
  }

  const MAX_LAG = Math.floor(sampleRate / 50);
  const MIN_LAG = Math.floor(sampleRate / 1000);
  let bestOffset = -1;
  let bestCorr = 0;
  let lastCorr = 1;

  for (let lag = MIN_LAG; lag <= MAX_LAG; lag++){
    let corr = 0;
    for (let i=0; i<SIZE - lag; i++){
      corr += clipped[i] * clipped[i + lag];
    }
    corr = corr / (SIZE - lag);
    if (corr > 0.95 && corr > lastCorr) {
      bestOffset = lag; bestCorr = corr; break;
    }
    if (corr > bestCorr){
      bestCorr = corr; bestOffset = lag;
    }
    lastCorr = corr;
  }

  if (bestCorr < 0.01 || bestOffset === -1) return -1;

  const x1 = bestOffset > 1 ? bestOffset - 1 : bestOffset;
  const x2 = bestOffset;
  const x3 = bestOffset + 1;
  function acfAt(lag){
    let sum = 0;
    for (let i=0; i<SIZE - lag; i++){
      sum += clipped[i] * clipped[i + lag];
    }
    return sum / (SIZE - lag);
  }
  const y1 = acfAt(x1), y2 = acfAt(x2), y3 = acfAt(x3);
  const denom = (y1 - 2*y2 + y3);
  let refined = bestOffset;
  if (denom !== 0){
    const delta = 0.5 * (y1 - y3) / denom;
    refined = bestOffset + delta;
  }
  return sampleRate / refined;
}

// ---------- Loop ----------
function update(){
  analyser.getFloatTimeDomainData(timeData);
  const freq = autoCorrelate(timeData, audioCtx.sampleRate);
  if (freq > 0){
    const { name, oct, cents } = freqToNote(freq, a4);
    noteEl.textContent = name;
    octEl.textContent = "Oct " + oct;
    freqEl.textContent = freq.toFixed(2) + " Hz";
    setNeedle(cents);
  } else {
    setNeedle(0);
    freqEl.textContent = "—";
  }
  rafId = requestAnimationFrame(update);
}

// ---------- Start / Stop ----------
async function start(){
  if (isRunning) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false }
    });
    micSource = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.0;
    timeData = new Float32Array(analyser.fftSize);
    micSource.connect(analyser);
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    update();
  } catch(err){
    alert("Microphone access failed. Check browser permissions.");
    console.error(err);
  }
}

function stop(){
  if (!isRunning) return;
  cancelAnimationFrame(rafId);
  const tracks = micSource.mediaStream.getTracks();
  tracks.forEach(t=>t.stop());
  audioCtx.close?.();
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// ---------- Events ----------
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
a4El.addEventListener("input", e=>{
  a4 = Number(e.target.value);
  a4ValEl.textContent = a4 + " Hz";
});
modeEl.addEventListener("change", renderStrings);

// ---------- Init ----------
renderStrings();
