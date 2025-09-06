// Minimal Music Interval Quiz
// Generates a 10-question round about intervals between notes.
// Question types:
// 1. "What is the fifth of C?" (forward interval)
// 2. "C is the fifth of which note?" (reverse interval)

const app = document.getElementById('app');
if (!app) throw new Error('#app missing');

// Canonical sharp-based chromatic scale
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
const NOTE_SET = new Set(NOTES);
// Display list includes flats alongside sharps for user clarity (diesis & bemolle)
const DISPLAY_NOTES: { value: string; label: string }[] = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#/Db' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#/Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#/Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#/Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#/Bb' },
  { value: 'B', label: 'B' },
];

// Flat to sharp mapping accepted from user input
const FLAT_MAP: Record<string,string> = { 'DB':'C#','EB':'D#','GB':'F#','AB':'G#','BB':'A#' };

// Intervals (using ordinal labels now)
interface IntervalDef { name: string; semitones: number; }
const INTERVALS: IntervalDef[] = [
  { name: '2nd', semitones: 2 },
  { name: '3rd',  semitones: 4 },
  { name: '4th', semitones: 5 },
  { name: '5th',  semitones: 7 },
  { name: '6th',  semitones: 9 },
  { name: '7th', semitones: 11 },
];

interface Question {
  text: string;          // question wording
  answer: string;        // expected normalized note (sharp form)
  interval: IntervalDef; // chosen interval
  type: 'forward'|'reverse';
  root: string;          // original root note for interval
  target: string;        // resulting note (forward)
  userAnswer?: string;
  correct?: boolean;
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }

function generateQuestion(): Question {
  const interval = rand(INTERVALS);
  const root = rand([...NOTES]);
  const target = NOTES[(NOTES.indexOf(root) + interval.semitones) % NOTES.length];
  // Randomly choose type
  if (Math.random() < 0.5) {
    return {
      text: `What is the ${interval.name} of ${root}?`,
      answer: target,
      interval,
      type: 'forward',
      root,
      target,
    };
  } else {
    // Reverse: given target, ask for which root yields that target as interval
    return {
      text: `${target} is the ${interval.name} of which note?`,
      answer: root,
      interval,
      type: 'reverse',
      root,
      target,
    };
  }
}

function generateQuiz(count = 10): Question[] {
  const qs: Question[] = [];
  for (let i=0;i<count;i++) qs.push(generateQuestion());
  return qs;
}

function normalizeNote(input: string): string | null {
  const raw = input.trim().toUpperCase();
  if (!raw) return null;
  if (NOTE_SET.has(raw as any)) return raw;
  if (FLAT_MAP[raw]) return FLAT_MAP[raw];
  return null;
}

let questions: Question[] = generateQuiz();
let idx = 0;
let correctCount = 0;
let finished = false;
let feedback: string | null = null;
let awaitingNext = false; // after submitting, show Next button

function submitAnswer(answerRaw: string) {
  if (finished) return;
  const q = questions[idx];
  const norm = normalizeNote(answerRaw);
  if (!norm) {
    feedback = `<div style=\"padding:.55rem .7rem; border:1px solid #d97706; background:#fff7ed; color:#92400e; border-radius:6px; font-weight:600;\">⚠️ Invalid note. Use letters with optional # or flats (e.g. Bb).\nAccepted: C C#/Db D D#/Eb E F F#/Gb G G#/Ab A A#/Bb B</div>`;
    render();
    return;
  }
  q.userAnswer = norm;
  q.correct = norm === q.answer;
  if (q.correct) {
    correctCount++;
    feedback = `<div style=\"padding:.6rem .75rem; border:1px solid #16a34a; background:#f0fdf4; color:#166534; border-radius:6px; font-weight:600;\">✅ Correct! <span style=\"font-weight:500\">Answer: ${q.answer}</span></div>`;
  } else {
    feedback = `<div style=\"padding:.6rem .75rem; border:1px solid #dc2626; background:#fef2f2; color:#991b1b; border-radius:6px; font-weight:600;\">❌ Incorrect. <span style=\"font-weight:500\">Correct: ${q.answer}</span></div>`;
  }
  awaitingNext = true;
  render();
}

function nextQuestion() {
  if (!awaitingNext) return;
  idx++;
  feedback = null;
  awaitingNext = false;
  if (idx >= questions.length) {
    finished = true;
  }
  render();
}

function restart() {
  questions = generateQuiz();
  idx = 0;
  correctCount = 0;
  finished = false;
  feedback = null;
  awaitingNext = false;
  render();
}

app.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t && t.id === 'next') {
    nextQuestion();
  } else if (t && t.id === 'restart') {
    restart();
  } else if (t && t.dataset && t.dataset.note) {
    if (!awaitingNext && !finished) {
      // Auto-submit directly
      submitAnswer(t.dataset.note);
    }
  }
});

function render() {
  if (!app) return;
  if (finished) {
    app.innerHTML = `
      <h1>Interval Quiz</h1>
      <p>Round complete.</p>
      <p>Score: <strong>${correctCount}</strong> / ${questions.length} (${Math.round((correctCount/questions.length)*100)}%)</p>
      <button id=\"restart\">Start New Round</button>
      <div class=\"small\" style=\"margin-top:1rem;\">
        <details><summary>Review answers</summary>
          <ol style=\"padding-left:1.2rem; line-height:1.4;\">
            ${questions.map(q => `<li>${q.text}<br><span style=\"display:inline-block;margin-top:.15rem;font-weight:600;${q.correct? 'color:#166534;background:#f0fdf4;border:1px solid #16a34a;' : 'color:#991b1b;background:#fef2f2;border:1px solid #dc2626;'}padding:.25rem .45rem;border-radius:4px;\">${q.correct? '✅':'❌'} Your answer: ${q.userAnswer ?? '(none)'} ${q.correct? '' : `→ Correct: ${q.answer}`}</span></li>`).join('')}
          </ol>
        </details>
      </div>
    `;
    return;
  }

  const q = questions[idx];
  app.innerHTML = `
    <h1>Interval Quiz</h1>
    <p>Question ${idx+1} of ${questions.length}</p>
    <p style=\"font-weight:600;\">${q.text}</p>
    <form id=\"answer-form\" autocomplete=\"off\" style=\"margin:0 0 0.75rem 0;\">
      <label for=\"answer\" style=\"display:block;margin-bottom:.25rem;\">Answer (note):</label>
      <input id=\"answer\" name=\"answer\" type=\"text\" inputmode=\"text\" style=\"padding:.4rem .6rem; font-size:1rem; width:140px;\" maxlength=\"3\" />
      ${!awaitingNext ? '<button id=\"submitBtn\" type=\"submit\" style=\"margin-left:.5rem;\">✅ Submit</button>' : ''}
      ${awaitingNext ? '<button type=\"button\" id=\"next\" style=\"margin-left:.5rem;\">Next ➡️</button>' : ''}
    </form>
    <div class=\"note-pad\" style=\"margin:.5rem 0 0; display:flex; flex-wrap:wrap; gap:.4rem;\">
      ${DISPLAY_NOTES.map(n => `<button type=\"button\" class=\"note-btn\" data-note=\"${n.value}\" style=\"padding:.35rem .65rem; font-size:.85rem; border:1px solid #999; background:#ececec; color:#222; cursor:pointer; border-radius:4px; line-height:1.1;\">${n.label}</button>`).join('')}
    </div>
    ${feedback ? `<div style=\"margin:.75rem 0 .25rem;\">${feedback}</div>` : ''}
    <div class=\"small\" style=\"margin-top:.9rem;\">Score so far: ${correctCount} correct</div>
  `;
  const form = document.getElementById('answer-form') as HTMLFormElement | null;
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (awaitingNext) { nextQuestion(); return; }
    const input = (document.getElementById('answer') as HTMLInputElement | null);
    if (input) submitAnswer(input.value);
  });
  const answerInput = document.getElementById('answer') as HTMLInputElement | null;
  if (answerInput && awaitingNext) { answerInput.disabled = true; }
  if (awaitingNext) {
    const nb = document.getElementById('next') as HTMLButtonElement | null;
    nb?.focus();
  } else {
    answerInput?.focus();
    answerInput?.select();
  }
}

render();

// Export placeholder to keep module style consistent if needed later
export {};
