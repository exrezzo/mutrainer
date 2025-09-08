// Refactored main: orchestrates quiz flow, rendering & interactions.
import { NOTES, DISPLAY_NOTES, generateQuiz, normalizeNote, Question } from './quiz';
import { createActiveTimer } from './timer';

const app = document.getElementById('app');
if (!app) throw new Error('#app missing');

// ---------- State ----------
let questions: Question[] = generateQuiz();
let idx = 0;
let correctCount = 0;
let finished = false;
let feedbackHtml: string | null = null;
let awaitingNext = false; // true after answer submitted until next pressed
let totalTimeMs: number | null = null;

// Active-time timer (only counts answering segments)
const timer = createActiveTimer((secs) => {
  const span = document.getElementById('elapsed');
  if (span) span.textContent = secs + 's';
});
timer.start(); // start first question segment

// ---------- Helpers ----------
const pct = () => Math.round((correctCount / questions.length) * 100);
function isMobile(): boolean {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    if (/Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet|Touch/.test(ua)) return true;
  }
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    try { if (window.matchMedia('(pointer:coarse)').matches) return true; } catch {}
  }
  return false;
}

function feedbackBox(type: 'correct' | 'incorrect' | 'invalid', message: string): string {
  const styles: Record<string,string> = {
    correct: 'border:1px solid #16a34a; background:#f0fdf4; color:#166534;',
    incorrect: 'border:1px solid #dc2626; background:#fef2f2; color:#991b1b;',
    invalid: 'border:1px solid #d97706; background:#fff7ed; color:#92400e;'
  };
  return `<div style="padding:.6rem .75rem; border-radius:6px; font-weight:600; ${styles[type]}">${message}</div>`;
}

// ---------- Note Color Mapping ----------
const NOTE_COLOR_MAP: Record<string,{bg:string;fg:string}> = {
  'C':  { bg:'#cfe8ff', fg:'#06385e' },       // light blue
  'C#': { bg:'#e3f3ff', fg:'#06385e' },       // lighter blue
  'D':  { bg:'#53c46a', fg:'#063516' },       // green
  'D#': { bg:'#b7edbb', fg:'#184a1c' },       // light green
  'E':  { bg:'#c49a6c', fg:'#3e2812' },       // brown
  'F':  { bg:'#b5b5b5', fg:'#222' },         // grey
  'F#': { bg:'#e0e0e0', fg:'#222' },         // light grey
  'G':  { bg:'#ffb347', fg:'#5a3100' },       // orange
  'G#': { bg:'#ffd8a6', fg:'#5a3100' },       // light orange
  'A':  { bg:'#ef4444', fg:'#fff' },         // red
  'A#': { bg:'#fca5a5', fg:'#5a0a0a' },       // light red
  'B':  { bg:'#fde047', fg:'#563f00' },       // yellow
};
function noteBadge(note: string, opts: {pad?:boolean} = {}): string {
  const n = note.toUpperCase();
  const c = NOTE_COLOR_MAP[n];
  if (!c) return note; // fallback plain
  const style = `display:inline-block;${opts.pad!==false?'padding:2px 6px;':''}margin:0 2px;border-radius:999px;font-weight:600;font-size:.9em;background:${c.bg};color:${c.fg};line-height:1;vertical-align:baseline;`;
  return `<span data-note-badge="${n}" style="${style}">${note}</span>`;
}
const NOTE_REGEX = /\b([A-G](?:#{1,2}|b{1,2})?)\b/g;
function colorizeNotes(text: string): string {
  return text.replace(NOTE_REGEX, (m) => noteBadge(m));
}

function buildReview(): string {
  return `
    <details><summary>Review answers</summary>
      <ol style="padding-left:1.2rem; line-height:1.4;">
        ${questions.map(q => {
          const badgeStyle = q.correct
            ? 'color:#166534;background:#f0fdf4;border:1px solid #16a34a;'
            : 'color:#991b1b;background:#fef2f2;border:1px solid #dc2626;';
          const ua = q.userAnswer ? noteBadge(q.userAnswer, { pad:false }) : '(none)';
          const ca = noteBadge(q.answer, { pad:false });
          return `<li>${colorizeNotes(q.text)}<br><span style="display:inline-block;margin-top:.15rem;font-weight:600;${badgeStyle}padding:.25rem .45rem;border-radius:4px;">${q.correct?'✅':'❌'} Your answer: ${ua} ${q.correct?'':`→ Correct: ${ca}`}</span></li>`;
        }).join('')}
      </ol>
    </details>`;
}

// ---------- Actions ----------
function submitAnswer(raw: string) {
  if (finished || awaitingNext) return;
  const q = questions[idx];
  const norm = normalizeNote(raw);
  if (!norm) {
    feedbackHtml = feedbackBox('invalid', '⚠️ Invalid note. Use letters with optional # or flats (e.g. Bb). Accepted: ' + ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(n=>noteBadge(n)).join(' '));
    awaitingNext = true;
    timer.endSegment();
    render();
    return;
  }
  q.userAnswer = norm;
  q.correct = norm === q.answer;
  if (q.correct) {
    correctCount++;
    feedbackHtml = feedbackBox('correct', `✅ Correct! Answer: ${noteBadge(q.answer)}`);
  } else {
    feedbackHtml = feedbackBox('incorrect', `❌ Incorrect. Your answer: ${noteBadge(q.userAnswer)} → Correct: ${noteBadge(q.answer)}`);
  }
  awaitingNext = true;
  timer.endSegment();
  render();
}

function nextQuestion() {
  if (!awaitingNext || finished) return;
  idx++;
  feedbackHtml = null;
  awaitingNext = false;
  if (idx >= questions.length) {
    finished = true;
    totalTimeMs = timer.finalize();
  } else {
    timer.beginSegment(); // resume active timing
  }
  render();
}

function restart() {
  questions = generateQuiz();
  idx = 0; correctCount = 0; finished = false; feedbackHtml = null; awaitingNext = false; totalTimeMs = null;
  timer.start();
  render();
}

// ---------- Rendering ----------
function render() {
  if (!app) return;
  if (finished) {
    app.innerHTML = `
      <h1>Interval Quiz</h1>
      <p>Round complete.</p>
      <p>Score: <strong>${correctCount}</strong> / ${questions.length} (${pct()}%)</p>
      ${totalTimeMs != null ? `<p>Time: <strong>${(totalTimeMs/1000).toFixed(1)}s</strong> (avg ${(totalTimeMs/1000/questions.length).toFixed(1)}s/question)</p>` : ''}
      <button id="restart">Start New Round</button>
      <div class="small" style="margin-top:1rem;">${buildReview()}</div>
    `;
    return;
  }
  const q = questions[idx];
  app.innerHTML = `
    <h1>Interval Quiz</h1>
    <p>Question ${idx+1} of ${questions.length} <span id="elapsed" style="margin-left:.75rem; font-size:.85em; color:#444;">0s</span></p>
    <p style="font-weight:600;">${colorizeNotes(q.text)}</p>
    <form id="answer-form" autocomplete="off" style="margin:0 0 0.75rem 0;">
      <label for="answer" style="display:block;margin-bottom:.25rem;">Answer (note):</label>
      <input id="answer" name="answer" type="text" inputmode="text" style="padding:.4rem .6rem; font-size:1rem; width:140px;" maxlength="3" />
      ${!awaitingNext ? '<button id="submitBtn" type="submit" style="margin-left:.5rem;">✅ Submit</button>' : ''}
      ${awaitingNext ? '<button type="button" id="next" style="margin-left:.5rem;">Next ➡️</button>' : ''}
    </form>
    <div class="note-pad" style="margin:.5rem 0 0; display:flex; flex-wrap:wrap; gap:.4rem;">
      ${NOTES.map(n => {
        const c = NOTE_COLOR_MAP[n];
        const bg = c?.bg || '#ececec';
        const fg = c?.fg || '#222';
        return `<button type="button" class="note-btn" data-note="${n}" style="padding:.4rem .7rem; font-size:.85rem; border:1px solid rgba(0,0,0,.25); background:${bg}; color:${fg}; cursor:pointer; border-radius:999px; line-height:1.1; font-weight:600;">${DISPLAY_NOTES.find(d=>d.value===n)?.label || n}</button>`;
      }).join('')}
    </div>
    ${feedbackHtml ? `<div style="margin:.75rem 0 .25rem;">${feedbackHtml}</div>` : ''}
    <div class="small" style="margin-top:.9rem;">Score so far: ${correctCount} correct</div>
  `;
  // Form behavior
  const form = document.getElementById('answer-form') as HTMLFormElement | null;
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (awaitingNext) { nextQuestion(); return; }
    const input = document.getElementById('answer') as HTMLInputElement | null;
    if (input) submitAnswer(input.value);
  });
  const answerInput = document.getElementById('answer') as HTMLInputElement | null;
  if (answerInput && awaitingNext) answerInput.disabled = true;
  if (awaitingNext) {
    (document.getElementById('next') as HTMLButtonElement | null)?.focus();
  } else {
    if (!isMobile() && answerInput) { answerInput.focus(); answerInput.select(); }
  }
}

// ---------- Event Delegation ----------
app.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.id === 'next') return nextQuestion();
  if (t.id === 'restart') return restart();
  if (t.dataset.note && !finished && !awaitingNext) return submitAnswer(t.dataset.note);
});

render();

export {}; // keep module style
