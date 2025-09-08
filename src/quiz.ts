/** Quiz domain: notes, intervals, question generation & normalization */

export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
export const NOTE_SET = new Set(NOTES);
export const DISPLAY_NOTES: { value: string; label: string }[] = [
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

export const FLAT_MAP: Record<string,string> = { 'DB':'C#','EB':'D#','GB':'F#','AB':'G#','BB':'A#' };

export interface IntervalDef { name: string; semitones: number; }
export const INTERVALS: IntervalDef[] = [
  { name: '2nd', semitones: 2 },
  { name: '3rd',  semitones: 4 },
  { name: '4th', semitones: 5 },
  { name: '5th',  semitones: 7 },
  { name: '6th',  semitones: 9 },
  { name: '7th', semitones: 11 },
];

export interface Question {
  text: string;
  answer: string;        // normalized sharp form
  interval: IntervalDef;
  type: 'forward'|'reverse';
  root: string;
  target: string;
  userAnswer?: string;
  correct?: boolean;
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }

export function generateQuestion(): Question {
  const interval = rand(INTERVALS);
  const root = rand([...NOTES]);
  const target = NOTES[(NOTES.indexOf(root) + interval.semitones) % NOTES.length];
  if (Math.random() < 0.5) {
    return { text: `What is the ${interval.name} of ${root}?`, answer: target, interval, type: 'forward', root, target };
  }
  return { text: `${target} is the ${interval.name} of which note?`, answer: root, interval, type: 'reverse', root, target };
}

export function generateQuiz(count = 10): Question[] { return Array.from({length: count}, () => generateQuestion()); }

export function normalizeNote(input: string): string | null {
  const raw = input.trim().toUpperCase();
  if (!raw) return null;
  if (NOTE_SET.has(raw as any)) return raw;
  if (FLAT_MAP[raw]) return FLAT_MAP[raw];
  return null;
}

