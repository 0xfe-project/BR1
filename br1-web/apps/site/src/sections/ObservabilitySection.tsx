import { createSignal, For, onMount, onCleanup, type Component } from "solid-js";
import { SectionHead } from "../components/SectionHead";
import { BarChart } from "../components/BarChart";

interface Seg { label: string; value: number; color: string; }
const SEGMENTS: Seg[] = [
  { label: "SYSTEM PROMPT", value: 1389, color: "var(--state-info)" },
  { label: "TOOL DEFS",     value: 1574, color: "var(--state-warning)" },
  { label: "PERSONA",       value: 580,  color: "var(--state-success)" },
  { label: "ASSISTANT",     value: 356,  color: "var(--color-muted)" },
  { label: "USER",          value: 10,   color: "var(--color-fg)" },
];
const TOTAL = SEGMENTS.reduce((s, x) => s + x.value, 0);

/**
 * The same numbers, drawn twice. Nothing about the data changes between the
 * two — only the ethics of the drawing do.
 */
const Donut: Component<{ mode: "decorative" | "br1" }> = (props) => {
  const R = 46, C = 2 * Math.PI * R, GAP = 4;
  const decorative = () => props.mode === "decorative";

  const slices = () => {
    let offset = 0;
    return SEGMENTS.map((s) => {
      const usable = C - GAP * SEGMENTS.length;
      const len = (s.value / TOTAL) * usable;
      const dash = `${Math.max(0, len - (decorative() ? 0 : 0))} ${C - len}`;
      const so = -offset;
      offset += len + GAP;
      return { ...s, dash, so };
    });
  };

  const blues = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

  return (
    <div style={{
      display: "flex", gap: "20px", "align-items": "center",
      padding: decorative() ? "20px" : "0",
      "border-radius": decorative() ? "12px" : "0",
      background: decorative() ? "#ffffff" : "transparent",
      "box-shadow": decorative() ? "0 4px 16px rgba(0,0,0,0.10)" : "none",
      border: decorative() ? "none" : "1px solid var(--color-border)",
    }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <For each={slices()}>{(s, i) => (
          <circle
            cx="60" cy="60" r={R} fill="none"
            stroke={decorative() ? blues[i()] : s.color}
            stroke-width={decorative() ? "14" : "13"}
            stroke-linecap={decorative() ? "round" : "butt"}
            stroke-dasharray={s.dash}
            stroke-dashoffset={s.so}
          />
        )}</For>
        <text x="60" y="57" text-anchor="middle"
              font-family={decorative() ? "var(--font-ui)" : "var(--font-mono)"}
              font-size={decorative() ? "15" : "14"} font-weight="700"
              fill={decorative() ? "#111827" : "var(--color-fg)"}>
          {(TOTAL / 1000).toFixed(1)}k
        </text>
        <text x="60" y="71" text-anchor="middle"
              font-family={decorative() ? "var(--font-ui)" : "var(--font-mono)"}
              font-size="7" letter-spacing={decorative() ? "0" : "0.12em"}
              fill={decorative() ? "#6b7280" : "var(--color-muted)"}>
          {decorative() ? "tokens" : "TOTAL"}
        </text>
      </svg>

      <div style={{ display: "flex", "flex-direction": "column", gap: decorative() ? "10px" : "4px", "min-width": "180px" }}>
        <For each={SEGMENTS}>{(s, i) => (
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span style={{
              width: "9px", height: "9px", "flex-shrink": "0",
              background: decorative() ? blues[i()] : s.color,
              "border-radius": decorative() ? "50%" : "0",
            }} />
            <span style={{
              flex: "1",
              "font-family": decorative() ? "var(--font-ui)" : "var(--font-mono)",
              "font-size": decorative() ? "12px" : "9px",
              "font-weight": decorative() ? "500" : "700",
              "letter-spacing": decorative() ? "0" : "0.1em",
              "text-transform": decorative() ? "none" : "uppercase",
              color: decorative() ? "#4b5563" : "var(--color-muted)",
            }}>{decorative() ? s.label.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : s.label}</span>
            <span style={{
              "font-family": "var(--font-mono)", "font-size": "9px", "font-weight": "700",
              "font-variant-numeric": "tabular-nums",
              color: decorative() ? "#111827" : s.color,
            }}>{s.value.toLocaleString()}</span>
          </div>
        )}</For>

        <div style={{
          "margin-top": "4px",
          "font-family": decorative() ? "var(--font-ui)" : "var(--font-mono)",
          "font-size": decorative() ? "11px" : "9px",
          "letter-spacing": decorative() ? "0" : "0.08em",
          color: decorative() ? "#059669" : "var(--color-faint)",
        }}>
          {decorative() ? "↑ Trending up by 5.2%" : "NO TREND. NO SPARKLINE. NO STORY."}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */

interface Ev { t: number; kind: string; detail: string; tone: string; }

const ObservabilitySection: Component = () => {
  const [events, setEvents] = createSignal<Ev[]>([]);
  const [live, setLive] = createSignal(0);

  onMount(() => {
    const push = (kind: string, detail: string, tone: string) => {
      const t = Math.round(performance.now());
      setEvents((prev) => [{ t, kind, detail, tone }, ...prev].slice(0, 14));
    };

    // These are real events, from this page, timestamped by the browser's
    // performance clock. Nothing below is invented.
    const onDown = (e: PointerEvent) => push("pointerdown", `${Math.round(e.clientX)},${Math.round(e.clientY)}`, "var(--color-fg)");
    const onKey = (e: KeyboardEvent) => push("keydown", e.key === " " ? "SPACE" : e.key.toUpperCase().slice(0, 12), "var(--color-fg)");
    const onResize = () => push("resize", `${window.innerWidth}×${window.innerHeight}`, "var(--state-warning)");
    const onVis = () => push("visibility", document.visibilityState, document.visibilityState === "visible" ? "var(--state-success)" : "var(--state-warning)");
    const onBlur = () => push("blur", "window lost focus", "var(--color-muted)");
    const onFocus = () => push("focus", "window focused", "var(--state-success)");

    let wheelTick = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - wheelTick < 120) return;
      wheelTick = now;
      push("wheel", `Δ${Math.round(e.deltaY)}`, "var(--color-muted)");
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("wheel", onWheel, { passive: true });

    const iv = setInterval(() => setLive((n) => n + 1), 1000);
    push("mounted", "observer attached", "var(--state-success)");

    onCleanup(() => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("wheel", onWheel);
      clearInterval(iv);
    });
  });

  return (
    <section id="observability" class="sec">
      <SectionHead index="06" label="OBSERVABILITY" note="mechanism transparency, not decoration" />

      <p class="sec-lede">
        A black box with a pulse animation is an insult; an exposed runtime is a courtesy. But
        exposure has two forms — <em>decorative transparency</em> performs "I am technology",
        mechanism transparency actually tells you something.
      </p>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div class="spec-cell" style={{ background: "#f8f8f8" }}>
          <div class="spec-cell-head" style={{ "border-bottom-color": "rgba(0,0,0,0.1)" }}>
            <span class="ml" style={{ color: "#6b7280" }}>DECORATIVE</span>
            <span class="spec-cell-note" style={{ color: "#6b7280" }}>same data, softened</span>
          </div>
          <Donut mode="decorative" />
          <div style={{ "font-family": "var(--font-ui)", "font-size": "11px", color: "#6b7280", "line-height": "1.6" }}>
            rounded caps · circle legend dots · decorative colour ramp · drop shadow ·
            "trending up" · reads as a marketing asset
          </div>
        </div>

        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">BR1</span>
            <span class="spec-cell-note">same data, readable</span>
          </div>
          <Donut mode="br1" />
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--color-muted)", "line-height": "1.7" }}>
            butt caps · square swatches · semantic colour only · no shadow ·
            no trend line · reads as an instrument
          </div>
        </div>
      </div>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">BAR CHART</span>
            <span class="spec-cell-note">raw svg · anime.js spring · rx=0</span>
          </div>
          <BarChart
            unit="tokens"
            height={150}
            duration={300}
            bounce={0.18}
            data={[
              { label: "SYSTEM", value: 1389, color: "var(--state-info)" },
              { label: "TOOLS",  value: 1574, color: "var(--state-warning)" },
              { label: "PERSONA", value: 580, color: "var(--state-success)" },
              { label: "ASSIST", value: 356, color: "var(--color-muted)" },
              { label: "USER",   value: 10,  color: "var(--color-fg)" },
            ]}
          />
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", "color": "var(--color-muted)", "line-height": "1.7" }}>
            No charting library. The bars overshoot and settle on one shared spring, and the
            readout under the axis reports the spring's own progress — the animation state is the
            observable state.
          </div>
        </div>

        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">WHAT A LIBRARY WOULD DO</span>
            <span class="spec-cell-note">same data, softer</span>
          </div>
          <div style={{ display: "flex", "align-items": "flex-end", gap: "10px", height: "150px", padding: "20px", background: "#ffffff", "border-radius": "12px", "box-shadow": "0 4px 16px rgba(0,0,0,0.10)" }}>
            <For each={[
              { h: 62, c: "#a5b4fc" }, { h: 70, c: "#818cf8" },
              { h: 26, c: "#c7d2fe" }, { h: 16, c: "#e0e7ff" }, { h: 4, c: "#eef2ff" },
            ]}>{(b) => (
              <div style={{
                flex: "1", height: `${b.h}%`, background: b.c,
                "border-radius": "6px 6px 0 0",
              }} />
            )}</For>
          </div>
          <div style={{ "font-family": "var(--font-ui)", "font-size": "11px", color: "#6b7280", "line-height": "1.6" }}>
            rounded caps · decorative ramp · white card · blur shadow · no axis · the numbers
            are gone because the shape was supposed to be enough
          </div>
        </div>
      </div>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">REAL EVENT STREAM</span>
            <span class="spec-cell-note">this page · performance.now()</span>
          </div>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", "line-height": "1.7", "min-height": "180px" }}>
            <For each={events()}>{(e) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "var(--color-faint)", "font-variant-numeric": "tabular-nums", width: "54px", "text-align": "right" }}>
                  {e.t}ms
                </span>
                <span style={{ color: e.tone, "font-weight": "700", width: "88px" }}>{e.kind}</span>
                <span style={{ color: "var(--color-muted)", flex: "1", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                  {e.detail}
                </span>
              </div>
            )}</For>
            {events().length === 0 && <span style={{ color: "var(--color-faint)" }}>waiting for input…</span>}
          </div>
          <div class="ml ml--faint">
            click, type, resize, scroll — nothing here is generated on a timer
          </div>
        </div>

        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">THE TEST</span>
            <span class="spec-cell-note">apply to any readout</span>
          </div>
          <div class="stack" style={{ gap: "10px", "font-family": "var(--font-mono)", "font-size": "10px", "line-height": "1.7" }}>
            <div><span style={{ color: "var(--state-success)" }}>✓</span> does the number change when the system changes?</div>
            <div><span style={{ color: "var(--state-success)" }}>✓</span> could a user act differently after reading it?</div>
            <div><span style={{ color: "var(--state-success)" }}>✓</span> is it measured, or asserted?</div>
            <div><span style={{ color: "var(--state-error)" }}>✕</span> does it animate on a timer instead of on an event?</div>
            <div><span style={{ color: "var(--state-error)" }}>✕</span> does it only exist to look technical?</div>
          </div>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--color-faint)", "margin-top": "12px", "line-height": "1.7" }}>
            the spec panel on the right of this page passes all five.<br />
            a nothing-phone glyph matrix passes two.
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObservabilitySection;
export { ObservabilitySection };
