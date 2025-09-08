/** Active segmentation timer counting only answering time. */
export interface ActiveTimer {
  start(): void;               // reset + start first segment
  beginSegment(): void;        // resume (start a new active segment if paused)
  endSegment(): void;          // pause (end current active segment)
  finalize(): number;          // stop completely, return total ms
  getElapsedMs(): number;      // current accumulated (including active segment)
}

export function createActiveTimer(onTick?: (elapsedSeconds: number) => void): ActiveTimer {
  let accumulated = 0; // ms
  let segmentStart: number | null = null;
  let intervalId: number | null = null;

  function now() { return performance.now(); }
  function tick() {
    if (onTick) onTick(Math.floor(getElapsedMs()/1000));
  }
  function getElapsedMs(): number {
    const live = segmentStart != null ? (now() - segmentStart) : 0;
    return accumulated + live;
  }
  function clearLoop() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

  return {
    start() {
      clearLoop();
      accumulated = 0;
      segmentStart = now();
      tick();
      intervalId = window.setInterval(tick, 1000);
    },
    beginSegment() {
      if (segmentStart == null) {
        segmentStart = now();
        tick();
      }
    },
    endSegment() {
      if (segmentStart != null) {
        accumulated += now() - segmentStart;
        segmentStart = null;
        tick();
      }
    },
    finalize() {
      if (segmentStart != null) {
        accumulated += now() - segmentStart;
        segmentStart = null;
      }
      clearLoop();
      tick();
      return accumulated;
    },
    getElapsedMs,
  };
}

