// Entry point with simple console print


const app = document.getElementById('app');

const LS_KEY = 'mutranier:clickCount';
function loadCount(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch { return 0; }
}
function saveCount(val: number) {
  try { localStorage.setItem(LS_KEY, String(val)); } catch { /* ignore quota */ }
}

let clickCount = loadCount();
render(performance.now());

function render(time: number) {
  if (!app) return;
  app.innerHTML = `
    <h1>mutranier demo</h1>
    <p>A super minimal TypeScript app deployed with GitHub Pages.</p>
    <div class="card">
      <div class="buttons">
        <button id="btn">Clicked <strong>${clickCount}</strong> times</button>
        <button id="reset" class="secondary" aria-label="Reset click counter">Reset</button>
      </div>
      <p class="small">Elapsed: ${(time / 1000).toFixed(1)}s</p>
    </div>
    <p class="small dims">Edit <code>src/main.ts</code> and save.</p>
  `;
  const btn = document.getElementById('btn');
  if (btn && !btn.dataset.bound) {
    btn.addEventListener('click', () => {
      clickCount++;
      saveCount(clickCount);
      render(performance.now());
    });
    btn.dataset.bound = '1';
  }
  const reset = document.getElementById('reset');
  if (reset && !reset.dataset.bound) {
    reset.addEventListener('click', () => {
      clickCount = 0;
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      render(performance.now());
    });
    reset.dataset.bound = '1';
  }
}

export function add(a: number, b: number) { return a + b; }
