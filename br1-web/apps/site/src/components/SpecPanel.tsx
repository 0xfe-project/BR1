import { createSignal, onMount, onCleanup, For, Show, type Component } from "solid-js";
import { metrics } from "../lib/metrics";
import { SECTIONS } from "../lib/sections";

/** Sum of every parsed CSS rule in the document, in bytes. Real, same-origin. */
function cssBytes(): number {
  let total = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) total += rule.cssText.length;
    } catch {
      /* cross-origin sheet: not measurable, not counted */
    }
  }
  return total;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

const SpecRow: Component<{ k: string; v: string; tone?: string }> = (props) => (
  <div class="spec-row">
    <span class="spec-key">{props.k}</span>
    <span class="spec-val" style={{ color: props.tone }}>{props.v}</span>
  </div>
);

export const SpecPanel: Component<{ active: string }> = (props) => {
  const [scrollPct, setScrollPct] = createSignal(0);
  const [viewport, setViewport] = createSignal("—");
  const [css, setCss] = createSignal(0);
  const [pointer, setPointer] = createSignal({ x: 0, y: 0 });
  const [range, setRange] = createSignal({ start: 0, end: 0 });

  let scrollHost: HTMLElement | undefined;

  onMount(() => {
    const readScroll = () => {
      const el = document.querySelector(".shell-main") as HTMLElement | null;
      scrollHost = el ?? undefined;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? el.scrollTop / max : 0);
      setRange({ start: el.scrollTop, end: el.scrollTop + el.clientHeight });
    };

    const readStatic = () => {
      setViewport(`${window.innerWidth}×${window.innerHeight}`);
      setCss(cssBytes());
      readScroll();
    };

    const onPointer = (e: PointerEvent) => setPointer({ x: e.clientX, y: e.clientY });

    window.addEventListener("resize", readStatic);
    window.addEventListener("pointermove", onPointer, { passive: true });
    const host = document.querySelector(".shell-main");
    host?.addEventListener("scroll", readScroll, { passive: true });

    readStatic();
    const iv = setInterval(readStatic, 1000);

    onCleanup(() => {
      window.removeEventListener("resize", readStatic);
      window.removeEventListener("pointermove", onPointer);
      host?.removeEventListener("scroll", readScroll);
      clearInterval(iv);
    });
  });

  const sectionLabel = () => SECTIONS.find((s) => s.id === props.active)?.label ?? "—";

  return (
    <>
      <div class="spec-section">
        <div class="spec-head">
          RUNNING DOCUMENT
          <span class="spec-head-note">measured, not asserted</span>
        </div>
        <Show when={metrics.visible()} fallback={
          <div class="spec-row">
            <span class="spec-key">SAMPLING</span>
            <span class="spec-val" style={{ color: "var(--state-warning)" }}>TAB HIDDEN</span>
          </div>
        }>
          <SpecRow
            k="FPS"
            v={metrics.sampled() ? String(metrics.fps()) : "—"}
            tone={!metrics.sampled() ? "var(--color-faint)" : metrics.fps() >= 55 ? "var(--state-success)" : "var(--state-warning)"}
          />
          <SpecRow k="FRAME" v={metrics.sampled() ? `${metrics.frameMs().toFixed(1)} ms` : "—"} />
        </Show>
        <SpecRow k="JANK / s" v={String(metrics.jank())}
                 tone={metrics.jank() > 0 ? "var(--state-warning)" : undefined} />
        <SpecRow k="DOM NODES" v={metrics.nodes().toLocaleString()} />
        <SpecRow k="DOM DEPTH" v={String(metrics.domDepth())} />
        <SpecRow k="CSS PARSED" v={fmtBytes(css())} />
        <SpecRow k="VIEWPORT" v={viewport()} />
      </div>

      <div class="spec-section">
        <div class="spec-head">POINTER</div>
        <SpecRow k="X" v={`${pointer().x} px`} />
        <SpecRow k="Y" v={`${pointer().y} px`} />
        <div class="spec-head-note" style={{ "font-family": "var(--font-mono)", "font-size": "8px", "margin-top": "4px" }}>
          read from the event stream, never from a timer
        </div>
      </div>

      <div class="spec-section">
        <div class="spec-head">VIEWPORT WINDOW</div>
        <SpecRow k="SCROLL" v={`${(scrollPct() * 100).toFixed(1)}%`} />
        <SpecRow k="TOP" v={`${Math.round(range().start)} px`} />
        <SpecRow k="BOTTOM" v={`${Math.round(range().end)} px`} />
        <div class="spec-bar">
          <div class="spec-bar-fill" style={{ width: `${scrollPct() * 100}%` }} />
        </div>
      </div>

      <div class="spec-section">
        <div class="spec-head">IN VIEW</div>
        <SpecRow k="SECTION" v={sectionLabel()} />
        <SpecRow k="TOTAL" v={String(SECTIONS.length)} />
      </div>
    </>
  );
};
