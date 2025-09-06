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
// Flat to sharp mapping accepted from user input
const FLAT_MAP: Record<string,string> = { 'DB':'C#','EB':'D#','GB':'F#','AB':'G#','BB':'A#' };

// Intervals (major/perfect) we will use (skip unison & octave for simplicity)
interface IntervalDef { name: string; semitones: number; }
const INTERVALS: IntervalDef[] = [
  { name: 'second', semitones: 2 },
  { name: 'third',  semitones: 4 },
  { name: 'fourth', semitones: 5 },
  { name: 'fifth',  semitones: 7 },
  { name: 'sixth',  semitones: 9 },
  { name: 'seventh',semitones: 11 },
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
    feedback = `Invalid note. Use letters with optional # or flats (e.g. Bb).`;
    render();
    return;
  }
  q.userAnswer = norm;
  q.correct = norm === q.answer;
  if (q.correct) correctCount++; else feedback = `Incorrect. Correct answer: ${q.answer}`;
  if (q.correct) feedback = 'Correct!';
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

function render() {
  if (!app) return;
  if (finished) {
    app.innerHTML = `
      <h1>Interval Quiz</h1>
      <p>Round complete.</p>
      <p>Score: <strong>${correctCount}</strong> / ${questions.length}</p>
      <button id="restart">Start New Round</button>
      <div class="small" style="margin-top:1rem;">
        <details><summary>Review answers</summary>
          <ol style="padding-left:1.2rem;">
            ${questions.map(q => `<li>${q.text}<br><span ${q.correct? 'style="color:green"':'style="color:#b00020"'}>Your answer: ${q.userAnswer ?? '(none)'} – ${q.correct? '✓':'✗'} (Correct: ${q.answer})</span></li>`).join('')}
          </ol>
        </details>
      </div>
    `;
    const restartBtn = document.getElementById('restart');
    restartBtn?.addEventListener('click', restart);
    return;
  }

  const q = questions[idx];
  app.innerHTML = `
    <h1>Interval Quiz</h1>
    <p>Question ${idx+1} of ${questions.length}</p>
    <p style="font-weight:600;">${q.text}</p>
    <form id="answer-form" autocomplete="off" style="margin:0 0 0.75rem 0;">
      <label for="answer" style="display:block;margin-bottom:.25rem;">Answer (note):</label>
      <input id="answer" name="answer" type="text" inputmode="text" style="padding:.4rem .6rem; font-size:1rem; width:140px;" maxlength="3" autofocus />
      <button type="submit" style="margin-left:.5rem;">Submit</button>
      ${awaitingNext ? '<button type="button" id="next" style="margin-left:.5rem;">Next</button>' : ''}
    </form>
    ${feedback ? `<div style="margin:.5rem 0; font-weight:600;">${feedback}</div>` : ''}
    <div class="small" style="margin-top:1rem;">Score so far: ${correctCount} correct</div>
  `;
  const form = document.getElementById('answer-form') as HTMLFormElement | null;
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (awaitingNext) return; // ignore if waiting for next
    const input = (document.getElementById('answer') as HTMLInputElement | null);
    if (input) submitAnswer(input.value);
  });
  const nextBtn = document.getElementById('next');
  nextBtn?.addEventListener('click', nextQuestion);
  const answerInput = document.getElementById('answer') as HTMLInputElement | null;
  if (answerInput && awaitingNext) {
    answerInput.disabled = true;
  }
}

render();

// Export placeholder to keep module style consistent if needed later
export {};
