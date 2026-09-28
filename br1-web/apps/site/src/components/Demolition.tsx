import { createSignal, onMount, onCleanup, For, type Component } from "solid-js";
import { animate, spring, createTimer, stagger } from "animejs";
import {
  LIVE, REGION_ORDER, regions, state, subscribe, transport, useRegion,
} from "../lib/demolition";
import { Panel } from "./Panel";
import { BarChart } from "./BarChart";
import { LatencyMeter } from "./LatencyMeter";
import "./Demolition.css";
import "./panel.css";

/* ---------------------------------------------------------------------------
 * The desktop.
 *
 * The first screen is not one specimen in the middle of a lot of air — it is a
 * table covered in instruments, the way a workstation is. Every window here is
 * a real one: the same components the sections below go into detail about, in
 * their compact form, all taken apart on the same sequence.
 * ------------------------------------------------------------------------- */

const VARS: Record<keyof typeof LIVE, string> = {
  rCard: "--r-card", rEl: "--r-el", shY: "--sh-y", shBlur: "--sh-blur",
  hard: "--hard", pad: "--pad", gap: "--gap", ts: "--ts", bs: "--bs", track: "--track",
};

function paint(el: HTMLElement, s: typeof LIVE) {
  for (const k of Object.keys(VARS) as (keyof typeof LIVE)[]) {
    el.style.setProperty(VARS[k], String(s[k]));
  }
}

interface Row { key: keyof typeof LIVE; label: string; from: string; fmt: (v: number) => string; }
const px = (v: number) => `${Math.round(v)}px`;

const ROWS: Row[] = [
  { key: "rCard",  label: "RADIUS",   from: "16px", fmt: px },
  { key: "shBlur", label: "BLUR",     from: "24px", fmt: px },
  { key: "hard",   label: "HARD-OFF", from: "0px",  fmt: (v) => px(v * 4) },
  { key: "pad",    label: "PADDING",  from: "22px", fmt: px },
  { key: "ts",     label: "TITLE",    from: "18px", fmt: px },
  { key: "track",  label: "TRACK",    from: "0.00", fmt: (v) => v.toFixed(2) },
];

const GRAYS = Array.from({ length: 10 }, (_, i) => `--gray-${i}`);
const SIGNALS: { token: string; label: string }[] = [
  { token: "--state-error",   label: "ERROR" },
  { token: "--state-warning", label: "PENDING" },
  { token: "--state-success", label: "DONE" },
  { token: "--state-info",    label: "RUNNING" },
];

const TYPE_ROWS = [
  { tag: "DISPLAY", size: "20px", weight: "700", style: "normal", text: "Hard edges are a promise" },
  { tag: "BODY",    size: "13px", weight: "400", style: "normal", text: "Density is respect, not clutter." },
  { tag: "ITALIC",  size: "13px", weight: "400", style: "italic", text: "metadata · timestamps" },
  { tag: "LABEL",   size: "10px", weight: "700", style: "normal", text: "RUNNING MODEl CUSTOM-99C215A1" },
];

/* ---- the specimen window ---- */

const SpecimenPanel: Component = () => {
  let card!: HTMLDivElement;
  const [br1, setBr1] = createSignal(false);
  const [snap, setSnap] = createSignal({ ...LIVE });
  let lastSum = Number.NaN;

  const repaint = () => {
    paint(card, LIVE);
    const sum = LIVE.rCard + LIVE.rEl + LIVE.shY + LIVE.shBlur + LIVE.hard
      + LIVE.pad + LIVE.gap + LIVE.ts + LIVE.bs + LIVE.track;
    if (!(Math.abs(sum - lastSum) < 0.002)) { lastSum = sum; setSnap({ ...LIVE }); }
    const isBr1 = LIVE.track > 0.5;
    if (isBr1 !== br1()) {
      setBr1(isBr1);
      card.setAttribute("data-hard", isBr1 ? "br1" : "deco");
    }
  };

  onMount(() => { repaint(); const off = subscribe(repaint); onCleanup(off); });

  const stageRef = useRegion("card");

  return (
    <Panel title="SPECIMEN" note="one element, ten properties" class="panel--specimen" chrome>
      <div class="dm-specimen-body" ref={stageRef}>
        <div class="dm-specimen-floor">
          <div ref={card} class="dm-card" data-hard="deco">
            <div class="dm-body">
              <div>
                <h3 class="dm-title">Account settings</h3>
                <p class="dm-sub">Manage your workspace preferences</p>
              </div>
              <div class="dm-rule" />
              <div class="dm-field">
                <label class="dm-label" for="dm-workspace-name">Workspace name</label>
                <input id="dm-workspace-name" class="dm-input" value="br1-design" readOnly tabIndex={-1} />
              </div>
              <div class="dm-rule" />
              <div class="dm-row">
                <span class="dm-label" style={{ flex: "1" }} id="dm-notify-label">Enable notifications</span>
                <div class="dm-toggle" role="img" aria-labelledby="dm-notify-label" />
              </div>
              <div class="dm-actions">
                <button class="dm-btn" tabIndex={-1} aria-hidden="true">Save changes</button>
              </div>
            </div>
          </div>
        </div>

        <div class="dm-specimen-props">
          <div class="dm-live-head">
            <span>LIVE PROPERTIES</span>
            <span class="dm-live-mode" style={{ color: br1() ? "var(--state-success)" : "var(--color-muted)" }}>
              {br1() ? "BR1" : "MODERN"}
            </span>
          </div>
          <For each={ROWS}>{(row) => (
            <div class="dm-live-row">
              <span class="dm-live-key">{row.label}</span>
              <span class="dm-live-from">{row.from}</span>
              <span class="dm-live-arrow">→</span>
              <span class="dm-live-val">{row.fmt(snap()[row.key])}</span>
            </div>
          )}</For>
        </div>
      </div>
    </Panel>
  );
};

/* ---- spring window ---- */

const SpringPanel: Component = () => {
  const [bounce, setBounce] = createSignal(0.18);
  const [duration, setDuration] = createSignal(240);
  const [progress, setProgress] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let block!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;

  const W = 300;
  const H = 44;

  function curve(b: number): number[] {
    const ease = spring({ bounce: b }) as unknown as (t: number) => number;
    return Array.from({ length: 140 }, (_, i) => {
      const t = i / 139;
      let v: number;
      try { v = ease(t); } catch { v = t; }
      return Number.isFinite(v) ? v : t;
    });
  }

  function draw(b: number, p: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const pts = curve(b);
    const lo = Math.min(0, ...pts);
    const hi = Math.max(1, ...pts);
    const yOf = (v: number) => H - 8 - ((v - lo) / (hi - lo)) * (H - 16);

    ctx.strokeStyle = "rgba(128,128,128,0.3)";
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, yOf(1)); ctx.lineTo(W, yOf(1)); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim() || "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = (i / (pts.length - 1)) * W;
      i === 0 ? ctx.moveTo(x, yOf(v)) : ctx.lineTo(x, yOf(v));
    });
    ctx.stroke();

    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(p * (pts.length - 1))));
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--state-warning").trim() || "#d9a441";
    ctx.fillRect((idx / (pts.length - 1)) * W - 1, yOf(pts[idx]) - 5, 3, 10);
  }

  onMount(() => {
    draw(bounce(), 0);
    const t = createTimer({
      duration: 2200, loop: true,
      onUpdate: (self: { progress: number }) => { if (!running()) draw(bounce(), self.progress ?? 0); },
    });
    onCleanup(() => t.cancel());
  });

  function fire() {
    if (!block) return;
    setRunning(true);
    animate(block, {
      x: [0, 190],
      duration: duration(),
      ease: spring({ bounce: bounce() }),
      onUpdate: (self: { progress: number }) => { const p = self.progress ?? 0; setProgress(p); draw(bounce(), p); },
      onComplete: () => setRunning(false),
    });
  }

  const overshoot = () => Math.max(0, (Math.max(...curve(bounce())) - 1) * 100);

  return (
    <Panel title="SPRING" note="the curve is the ease, sampled" class="panel--spring">
      <canvas ref={canvas} width={W} height={H} style={{ width: "100%", height: `${H}px`, display: "block" }} />
      <div class="mini-row" style={{ gap: "10px" }}>
        <span class="mini-key">OVERSHOOT</span>
        <span class="mini-val">{overshoot().toFixed(1)}%</span>
        <span class="mini-key" style={{ "margin-left": "8px" }}>T</span>
        <span class="mini-val" style={{ "margin-left": "0" }}>{progress().toFixed(2)}</span>
      </div>
      <div class="spring-track">
        <div ref={block} class="spring-block" />
      </div>
      <div class="mini-row" style={{ gap: "8px" }}>
        <button class="btn btn-outline btn-sm" onClick={fire}>FIRE</button>
        <span class="mini-key" style={{ color: "var(--color-faint)" }}>bounce</span>
        <input class="br1" type="range" aria-label="bounce" min="0" max="0.2" step="0.01"
               value={bounce()} style={{ flex: "1" }}
               onInput={(e) => { const v = Number(e.currentTarget.value); setBounce(v); draw(v, progress()); }} />
        <span class="mini-val">{bounce().toFixed(2)}</span>
      </div>
      <div class="mini-row" style={{ gap: "8px" }}>
        <span class="mini-key" style={{ color: "var(--color-faint)", width: "52px" }}>dur</span>
        <input class="br1" type="range" aria-label="duration in milliseconds" min="80" max="280" step="10"
               value={duration()} style={{ flex: "1" }}
               onInput={(e) => setDuration(Number(e.currentTarget.value))} />
        <span class="mini-val">{duration()}ms</span>
      </div>
    </Panel>
  );
};

/* ---- chart window ---- */

const ChartPanel: Component = () => (
  <Panel title="CHART" note="raw svg · anime.js spring · rx=0" class="panel--chart" chrome>
    <div class="dm-chart-fit">
      <BarChart
        unit="tokens"
        height={104}
        duration={300}
        bounce={0.18}
        data={[
          { label: "SYST", value: 1389, color: "var(--state-info)" },
          { label: "TOOL", value: 1574, color: "var(--state-warning)" },
          { label: "PERS", value: 580,  color: "var(--state-success)" },
          { label: "ASST", value: 356,  color: "var(--color-muted)" },
          { label: "USER", value: 10,   color: "var(--color-fg)" },
        ]}
      />
    </div>
    <div class="mini-row">
      <span class="mini-key" style={{ color: "var(--color-faint)" }}>
        no library · flat fill · no shadow · butt caps
      </span>
    </div>
  </Panel>
);

/* ---- tokens window ---- */

const TokenPanel: Component = () => (
  <Panel title="TOKENS" note="read from the document" class="panel--tokens">
    <div class="swatch-strip">
      <For each={GRAYS}>{(t) => <i style={{ background: `var(${t})` }} title={t} />}</For>
    </div>
    <div class="mini-row">
      <span class="mini-key" style={{ color: "var(--color-faint)" }}>neutral ramp · oklch · 10 steps</span>
    </div>
    <div class="signal-row">
      <For each={SIGNALS}>{(s) => <b style={{ color: `var(${s.token})` }}>{s.label}</b>}</For>
    </div>
    <div class="mini-row">
      <span class="mini-key" style={{ color: "var(--color-faint)" }}>
        the only saturation on the page
      </span>
    </div>
  </Panel>
);

/* ---- type window ---- */

const TypePanel: Component = () => (
  <Panel title="TYPE" note="weight × style × size" class="panel--type">
    <div class="type-mini">
      <For each={TYPE_ROWS}>{(t) => (
        <div class="type-mini-row">
          <span class="type-mini-tag">{t.tag}</span>
          <span class="type-mini-sample" style={{
            "font-size": t.size,
            "font-weight": t.weight,
            "font-style": t.style,
          }}>{t.text}</span>
        </div>
      )}</For>
    </div>
    <div class="mini-row">
      <span class="mini-key" style={{ color: "var(--color-faint)" }}>
        one face · hierarchy from case, weight and tracking
      </span>
    </div>
  </Panel>
);

/* ---- stages window ---- */

const StagesPanel: Component = () => (
  <Panel title="STAGES" note="one timeline, five regions" class="panel--stages">
    <div class="dm-manifest">
      <For each={REGION_ORDER}>{(key) => (
        <div class="dm-manifest-row">
          <span class="dm-manifest-name">{key}</span>
          <span class="dm-manifest-bar">
            <i style={{ width: `${Math.round(regions()[key] * 100)}%` }} />
          </span>
          <span class="dm-manifest-val">{String(Math.round(regions()[key] * 100)).padStart(3, " ")}%</span>
        </div>
      )}</For>
    </div>
  </Panel>
);

/* ---- the desktop ---- */

export const Demolition: Component = () => {
  const rootRef = useRegion("root");
  const controlsRef = useRegion("controls");

  const scrubKeys = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const p = state.progress();
    switch (e.key) {
      case "ArrowRight": case "ArrowUp":   transport.seek(p + step); break;
      case "ArrowLeft":  case "ArrowDown": transport.seek(p - step); break;
      case "PageUp":                        transport.seek(p + 0.1);  break;
      case "PageDown":                      transport.seek(p - 0.1);  break;
      case "Home":                          transport.seek(0);        break;
      case "End":                           transport.seek(1);        break;
      default: return;
    }
    e.preventDefault();
  };

  const scrub = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    transport.seek((e.clientX - rect.left) / rect.width);
  };

  return (
    <div class="dm-workbench" ref={rootRef}>
      <div class="dm-desktop">
        <SpecimenPanel />
        <SpringPanel />
        <ChartPanel />
        <TokenPanel />
        <TypePanel />
        <Panel title="LATENCY" note="timed by the browser, not by us" class="panel--latency" chrome>
          <LatencyMeter compact />
        </Panel>
        <StagesPanel />
      </div>

      <div class="dm-transport" ref={controlsRef}>
        <div class="dm-transport-row">
          <button class="btn btn-outline btn-sm" onClick={() => transport.play()}>DEMOLISH</button>
          <button class="btn btn-ghost btn-sm" onClick={() => transport.reverse()}>RESTORE</button>
          <span class="dm-transport-status">
            {state.running() ? "RUNNING"
              : state.progress() > 0.99 ? "SETTLED"
              : state.progress() < 0.01 ? "IDLE" : "PAUSED"}
          </span>
          <span class="dm-transport-pct">{Math.round(state.progress() * 100)}%</span>
        </div>

        <div
          class="dm-scrub"
          onClick={scrub}
          onKeyDown={scrubKeys}
          tabIndex={0}
          role="slider"
          aria-label="demolition progress"
          aria-valuenow={Math.round(state.progress() * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${Math.round(state.progress() * 100)}% demolished`}
        >
          <div class="dm-scrub-fill" style={{ width: `${state.progress() * 100}%` }} />
        </div>

        <div class="dm-hint">
          every window on this screen is real · the whole page is taken apart in five stages · arrow-key the bar to scrub
        </div>
      </div>
    </div>
  );
};
