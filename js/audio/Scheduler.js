// Scheduler.js — the music clock (docs/AUDIO_PLAN.md §2): a setTimeout tick every 25 ms that
// schedules every beat falling within the next 120 ms, so notes are always queued a little
// ahead of the audio clock and never per animation frame. The clock and the timers are
// injectable, so tools/test-core.mjs drives it with a fake clock.
export class Scheduler {
  constructor({ now, setTimeout: st = (fn, ms) => setTimeout(fn, ms), clearTimeout: ct = (id) => clearTimeout(id), lookahead = 0.12, tick = 25 } = {}) {
    this.now = now; this._st = st; this._ct = ct; this.lookahead = lookahead; this.tickMs = tick;
    this.running = false; this.timer = null; this.tempo = 120; this.beat = 0; this.nextTime = 0; this.onBeat = null;
    this._tick = this._tick.bind(this);
  }
  get secondsPerBeat() { return 60 / this.tempo; }
  /** Start (or restart) at `tempo` with the first beat `startIn` seconds from now. */
  start(tempo, onBeat, { startIn = 0.05, beat = 0 } = {}) {
    this.stop();
    this.tempo = tempo; this.onBeat = onBeat; this.beat = beat; this.nextTime = this.now() + startIn; this.running = true;
    this._tick();
  }
  stop() { this.running = false; if (this.timer != null) { this._ct(this.timer); this.timer = null; } }
  setTempo(tempo) { this.tempo = tempo; }
  _tick() {
    if (!this.running) return;
    const horizon = this.now() + this.lookahead;
    let guard = 0;
    while (this.nextTime < horizon && guard++ < 64) {
      // a beat that fell behind the clock (a stalled tab) is skipped, not crammed in
      if (this.nextTime >= this.now() - 0.01) this.onBeat(this.beat, this.nextTime, this.secondsPerBeat);
      this.nextTime += this.secondsPerBeat; this.beat++;
    }
    this.timer = this._st(this._tick, this.tickMs);
  }
}
