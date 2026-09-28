import { createSignal, onMount, onCleanup, For, Show, type Component } from "solid-js";
import { animate, spring, createTimer, stagger } from "animejs";
import { SectionHead } from "../components/SectionHead";

const W = 360;
const H = 120;

/**
 * Latency meter.
 *
 * The claim under test is BR1's third principle: a state change happens now.
 * This runs the comparison and reports the number, taken from `transitionend`
 * — the browser's own account of when the control finished responding, not a
 * duration we configured and then asserted.
 */
const LatencyCell: Component = () => {
  const [runs, setRuns] = createSignal<{ kind: "BR1" | "MODERN"; ms: number }[]>([]);
  const [busy, setBusy] = createSignal(false);
  let instant!: HTMLDivElement;
  let timer!: HTMLDivElement;

  function measure(el: HTMLElement, kind: "BR1" | "MODERN", done: () => void) {
    const t0 = performance.now();
    let finished = false;

    const finish = (ms: number) => {
      if (finished) return;
      finished = true;
      el.removeAttribute("data-pressed");
      setRuns((prev) => [{ kind, ms }, ...prev].slice(0, 10));
      done();
    };

    const onEnd = () => finish(performance.now() - t0);
    el.addEventListener("transitionend", onEnd, { once: true });
    // a transition that never starts still has to release the meter
    const guard = window.setTimeout(() => finish(performance.now() - t0), 1500);

    // force a style read so the resting value is committed before we flip the
    // attribute — without it the browser may coalesce both into one recalc and
    // the transition never runs at all
    void getComputedStyle(el).transform;
    el.setAttribute("data-pressed", "");

    window.setTimeout(() => clearTimeout(guard), 1600);
  }

  function run() {
    if (busy()) return;
    setBusy(true);
    measure(instant, "BR1", () => {
      window.setTimeout(() => measure(timer, "MODERN", () => setBusy(false)), 250);
    });
  }

  const mean = (kind: "BR1" | "MODERN") => {
    const list = runs().filter((r) => r.kind === kind);
    if (list.length === 0) return "—";
    return (list.reduce((a, b) => a + b.ms, 0) / list.length).toFixed(1) + " ms";
  };

  return (
    <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))" }}>
      <div class="spec-cell">
        <div class="spec-cell-head">
          <span class="ml">LATENCY</span>
          <span class="spec-cell-note">time to a control having fully responded</span>
        </div>

        <div class="stack" style={{ gap: "12px" }}>
          <div class="row row--baseline" style={{ gap: "12px" }}>
            <span class="ml" style={{ width: "58px" }}>BR1</span>
            <div ref={instant} class="lat lat--instant" />
            <span class="ml ml--faint">state change · 20ms press, spring release</span>
          </div>
          <div class="row row--baseline" style={{ gap: "12px" }}>
            <span class="ml" style={{ width: "58px" }}>MODERN</span>
            <div ref={timer} class="lat lat--timer" />
            <span class="ml ml--faint">transition: 300ms ease-in-out</span>
          </div>
        </div>

        <div class="row" style={{ "margin-top": "12px" }}>
          <button class="btn btn-outline btn-sm" onClick={run} disabled={busy()}>
            {busy() ? "MEASURING…" : "MEASURE"}
          </button>
          <span class="ml ml--faint">both are timed by the browser, not by a stopwatch we hold</span>
        </div>
      </div>

      <div class="spec-cell">
        <div class="spec-cell-head">
          <span class="ml">RESULTS</span>
          <span class="spec-cell-note">{runs().length} of last 10</span>
        </div>

        <div class="ptable">
          <For each={runs()}>{(r) => (
            <div class="ptable-row" style={{ "grid-template-columns": "1fr auto" }}>
              <span style={{ color: r.kind === "BR1" ? "var(--state-success)" : "var(--color-muted)" }}>{r.kind}</span>
              <span style={{ color: "var(--color-fg)", "font-weight": "700" }}>{r.ms.toFixed(1)} ms</span>
            </div>
          )}</For>
          <Show when={runs().length === 0}>
            <div class="ptable-row" style={{ "grid-template-columns": "1fr" }}>
              <span style={{ color: "var(--color-faint)" }}>press MEASURE — the numbers come from the browser</span>
            </div>
          </Show>
        </div>

        <div class="row row--baseline" style={{ "margin-top": "10px", gap: "16px" }}>
          <span class="ml ml--faint">MEAN BR1</span>
          <span class="val" style={{ color: "var(--state-success)" }}>{mean("BR1")}</span>
          <span class="ml ml--faint">MEAN MODERN</span>
          <span class="val">{mean("MODERN")}</span>
        </div>
      </div>
    </div>
  );
};

interface Preset { label: string; bounce: number; duration: number; }
/**
 * Every preset settles inside 280ms, under the 300ms eased transition it is
 * drawn against, and no spring overshoots by more than 20%. A bounce above 0.2
 * stops reading as a mechanism and starts reading as a toy.
 */
const PRESETS: Preset[] = [
  { label: "TACTILE", bounce: 0.16, duration: 220 },
  { label: "SLAM",    bounce: 0.20, duration: 280 },
  { label: "SETTLE",  bounce: 0.08, duration: 260 },
  { label: "SNAP",    bounce: 0.20, duration: 180 },
];

/**
 * Stagger — one call, sixteen targets, one shared law offset in time.
 * The total the engine has to schedule is reported rather than guessed.
 */
const STAGGER_COUNT = 16;

const StaggerCell: Component = () => {
  const [amount, setAmount] = createSignal(28);
  const [fired, setFired] = createSignal(0);
  const [busy, setBusy] = createSignal(false);
  let track!: HTMLDivElement;

  const totalMs = () => amount() * (STAGGER_COUNT - 1) + 300;

  function fire() {
    if (!track) return;
    // anime.js takes an array of targets; a NodeList is array-*like*, not an array,
    // and it is ignored silently rather than rejected
    const blocks = Array.from(track.querySelectorAll(".stagger-block"));
    let seen = 0;
    setBusy(true);
    animate(blocks, {
      scale: [1, 1.5],
      opacity: [0.3, 1],
      duration: 200,
      ease: spring({ bounce: 0.2 }),
      delay: stagger(amount(), { start: 0 }),
      direction: "alternate",
      onBegin: () => setFired(0),
      onUpdate: () => {
        // count how many blocks have left rest, read from the live DOM
        let moved = 0;
        blocks.forEach((b) => {
          const m = getComputedStyle(b).transform;
          if (m !== "none" && m !== "matrix(1, 0, 0, 1, 0, 0)") moved++;
        });
        if (moved !== seen) { seen = moved; setFired(moved); }
      },
      onComplete: () => { setBusy(false); setFired(0); },
    });
  }

  return (
    <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))" }}>
      <div class="spec-cell">
        <div class="spec-cell-head">
          <span class="ml">STAGGER</span>
          <span class="spec-cell-note">one call · {STAGGER_COUNT} targets</span>
        </div>

        <div ref={track} class="stagger-track">
          <For each={Array.from({ length: STAGGER_COUNT })}>{() => <div class="stagger-block" />}</For>
        </div>

        <div class="row row--baseline" style={{ "margin-top": "4px", gap: "16px" }}>
          <span class="ml ml--faint">OFFSET</span>
          <span class="val">{amount()} ms</span>
          <span class="ml ml--faint">SCHEDULED</span>
          <span class="val">{totalMs()} ms</span>
          <span class="ml ml--faint">MOVING</span>
          <span class="val">{fired()} / {STAGGER_COUNT}</span>
        </div>
      </div>

      <div class="spec-cell">
        <div class="spec-cell-head">
          <span class="ml">OFFSET</span>
          <span class="spec-cell-note">delay between targets</span>
        </div>
        <input class="br1" type="range" aria-label="stagger offset in milliseconds" min="0" max="120" step="2" value={amount()}
               onInput={(e) => setAmount(Number(e.currentTarget.value))} />
        <div class="row">
          <button class="btn btn-outline btn-sm" onClick={fire} disabled={busy()}>
            {busy() ? "RUNNING…" : "FIRE"}
          </button>
          <For each={[0, 8, 20, 48]}>{(v) => (
            <button class="btn btn-ghost btn-sm" onClick={() => { setAmount(v); requestAnimationFrame(fire); }}>{v}ms</button>
          )}</For>
        </div>
        <div class="ml ml--faint">
          at 0 the blocks move as one; the wave is the delay, not a different animation.
        </div>
      </div>
    </div>
  );
};

export const MotionSection: Component = () => {
  const [bounce, setBounce] = createSignal(0.18);
  const [duration, setDuration] = createSignal(240);
  const [progress, setProgress] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let block!: HTMLDivElement;
  let modernBlock!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;

  /** The ease anime.js will actually use, sampled so the curve is never a redrawing of it. */
  function curve(b: number): number[] {
    const ease = spring({ bounce: b }) as unknown as (t: number) => number;
    const n = 160;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let v: number;
      try { v = ease(t); } catch { v = t; }
      out.push(typeof v === "number" && Number.isFinite(v) ? v : t);
    }
    return out;
  }

  function draw(b: number, p: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const pts = curve(b);
    const lo = Math.min(0, ...pts);
    const hi = Math.max(1, ...pts);
    const yOf = (v: number) => H - 14 - ((v - lo) / (hi - lo)) * (H - 28);

    // target line: where the element is supposed to end up
    ctx.strokeStyle = "rgba(128,128,128,0.28)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, yOf(1)); ctx.lineTo(W, yOf(1)); ctx.stroke();
    ctx.setLineDash([]);

    // the curve
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = (i / (pts.length - 1)) * W;
      i === 0 ? ctx.moveTo(x, yOf(v)) : ctx.lineTo(x, yOf(v));
    });
    ctx.stroke();

    // where the animation is right now
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(p * (pts.length - 1))));
    const mw = getComputedStyle(document.documentElement).getPropertyValue("--state-warning").trim() || "#d9a441";
    ctx.fillStyle = mw;
    ctx.fillRect((idx / (pts.length - 1)) * W - 1, yOf(pts[idx]) - 6, 3, 12);
  }

  onMount(() => {
    draw(bounce(), 0);
    const t = createTimer({
      duration: 2500,
      loop: true,
      onUpdate: (self: { progress: number }) => { if (!running()) draw(bounce(), self.progress ?? 0); },
    });
    onCleanup(() => { t.cancel(); });

    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      setTimeout(() => fire(), 400);
    }
  });

  function fire() {
    if (!block || !modernBlock) return;
    setRunning(true);

    // BR1: the same travel, expressed as a spring.
    animate(block, {
      x: [0, 240],
      duration: duration(),
      ease: spring({ bounce: bounce() }),
      onUpdate: (self: { progress: number }) => {
        const p = self.progress ?? 0;
        setProgress(p);
        draw(bounce(), p);
      },
      onComplete: () => setRunning(false),
    });

    // The thing BR1 is arguing with: a duration-based ease.
    animate(modernBlock, { x: [0, 240], duration: 240, ease: "inOutQuad" });
  }

  const overshoot = () => {
    const pts = curve(bounce());
    const peak = Math.max(...pts);
    return Math.max(0, (peak - 1) * 100);
  };

  return (
    <section id="motion" class="sec">
      <SectionHead index="04" label="MOTION" note="the curve is the ease, sampled" />

      <p class="sec-lede">
        A 300&nbsp;ms ease-in-out is a timer. A spring is a law. One is a pause; the other is a
        physical event. <em>Moving through space gets physics. Changing state gets none.</em>
      </p>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">EASE CURVE</span>
            <span class="spec-cell-note">sampled from spring()</span>
          </div>
          <canvas ref={canvas} width={W} height={H} style={{ width: "100%", height: `${H}px` }} />
          <div class="row row--baseline">
            <span class="ml ml--faint">OVERSHOOT</span>
            <span class="val">{overshoot().toFixed(1)}%</span>
            <span class="ml ml--faint" style={{ "margin-left": "auto" }}>PROGRESS</span>
            <span class="val">{(progress() * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">SAME DISTANCE, TWO LAWS</span>
            <span class="spec-cell-note">click FIRE</span>
          </div>

          <div class="stack" style={{ gap: "6px" }}>
            <div class="row row--baseline">
              <span class="ml" style={{ width: "52px" }}>MODERN</span>
              <span class="ml ml--faint">300ms · inOutQuad</span>
            </div>
            <div style={{ height: "26px", "border-left": "1px solid var(--color-border-strong)", position: "relative" }}>
              <div ref={modernBlock} style={{ position: "absolute", top: "3px", width: "20px", height: "20px", background: "var(--color-muted)" }} />
            </div>

            <div class="row row--baseline" style={{ "margin-top": "10px" }}>
              <span class="ml" style={{ width: "52px" }}>BR1</span>
              <span class="ml ml--faint">{duration()}ms · spring(bounce {bounce().toFixed(2)})</span>
            </div>
            <div style={{ height: "26px", "border-left": "1px solid var(--color-border-strong)", position: "relative" }}>
              <div ref={block} style={{ position: "absolute", top: "3px", width: "20px", height: "20px", background: "var(--color-fg)" }} />
            </div>
          </div>

          <div class="row" style={{ "margin-top": "14px" }}>
            <button class="btn btn-outline btn-sm" onClick={fire}>FIRE</button>
            <For each={PRESETS}>{(p) => (
              <button class="btn btn-ghost btn-sm" onClick={() => {
                setBounce(p.bounce);
                setDuration(p.duration);
                draw(p.bounce, progress());
                requestAnimationFrame(fire);
              }}>{p.label}</button>
            )}</For>
          </div>
        </div>
      </div>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div class="spec-cell">
          <div class="spec-cell-head"><span class="ml">BOUNCE</span><span class="spec-cell-note">spring</span></div>
          <input class="br1" type="range" aria-label="bounce" min="0" max="0.2" step="0.01" value={bounce()}
                 onInput={(e) => { const v = Number(e.currentTarget.value); setBounce(v); draw(v, progress()); }} />
          <span class="val">{bounce().toFixed(2)}</span>
        </div>
        <div class="spec-cell">
          <div class="spec-cell-head"><span class="ml">DURATION</span><span class="spec-cell-note">ms</span></div>
          <input class="br1" type="range" aria-label="duration in milliseconds" min="80" max="280" step="10" value={duration()}
                 onInput={(e) => setDuration(Number(e.currentTarget.value))} />
          <span class="val">{duration()}ms</span>
        </div>
        <div class="spec-cell">
          <div class="spec-cell-head"><span class="ml">STATE CHANGE</span><span class="spec-cell-note">no physics</span></div>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "11px", "line-height": "1.6", color: "var(--color-muted)" }}>
            hover 60ms<br />press 20ms<br />release spring ≤280ms
          </div>
        </div>
        <div class="spec-cell">
          <div class="spec-cell-head"><span class="ml">ENGINE</span><span class="spec-cell-note">anime.js v4</span></div>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "11px", "line-height": "1.6", color: "var(--color-muted)" }}>
            one rAF loop<br />all instances synced<br />spring is a function
          </div>
        </div>
      </div>

      <LatencyCell />

      <StaggerCell />
    </section>
  );
};
