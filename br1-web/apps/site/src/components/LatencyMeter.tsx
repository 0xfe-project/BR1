import { createSignal, For, Show, type Component } from "solid-js";

/**
 * Latency meter — the claim under test is BR1's third principle: a state change
 * happens now. Both numbers come from `transitionend`, the browser's own account
 * of when a control finished responding, not from a duration we configured and
 * then asserted.
 */
export const LatencyMeter: Component<{ compact?: boolean }> = (props) => {
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
      setRuns((prev) => [{ kind, ms }, ...prev].slice(0, props.compact ? 4 : 10));
      done();
    };

    el.addEventListener("transitionend", () => finish(performance.now() - t0), { once: true });
    const guard = window.setTimeout(() => finish(performance.now() - t0), 1500);

    // force a style read so the resting value is committed before the attribute
    // flips — otherwise the browser coalesces both into one recalc and the
    // transition never runs
    void getComputedStyle(el).transform;
    el.setAttribute("data-pressed", "");
    window.setTimeout(() => clearTimeout(guard), 1600);
  }

  function run() {
    if (busy()) return;
    setBusy(true);
    measure(instant, "BR1", () => {
      window.setTimeout(() => measure(timer, "MODERN", () => setBusy(false)), 220);
    });
  }

  const mean = (kind: "BR1" | "MODERN") => {
    const list = runs().filter((r) => r.kind === kind);
    if (list.length === 0) return "—";
    return (list.reduce((a, b) => a + b.ms, 0) / list.length).toFixed(0) + " ms";
  };

  return (
    <>
      <div class="mini" style={{ gap: "7px" }}>
        <div class="mini-row">
          <span class="mini-key" style={{ width: "52px" }}>BR1</span>
          <div ref={instant} class="lat lat--instant" />
          <span class="mini-key" style={{ color: "var(--color-faint)" }}>20ms press, spring release</span>
        </div>
        <div class="mini-row">
          <span class="mini-key" style={{ width: "52px" }}>MODERN</span>
          <div ref={timer} class="lat lat--timer" />
          <span class="mini-key" style={{ color: "var(--color-faint)" }}>300ms ease-in-out</span>
        </div>
      </div>

      <div class="mini-row" style={{ gap: "14px" }}>
        <span class="mini-key">MEAN BR1</span>
        <span class="mini-val" style={{ color: "var(--state-success)" }}>{mean("BR1")}</span>
        <span class="mini-key" style={{ "margin-left": "12px" }}>MEAN MODERN</span>
        <span class="mini-val" style={{ "margin-left": "0" }}>{mean("MODERN")}</span>
      </div>

      <div class="mini-row" style={{ gap: "6px", "flex-wrap": "wrap" }}>
        <For each={runs()}>{(r) => (
          <span class="mini-key" style={{ color: r.kind === "BR1" ? "var(--state-success)" : "var(--color-muted)" }}>
            {r.kind.slice(0, 3)} {r.ms.toFixed(0)}ms
          </span>
        )}</For>
        <Show when={runs().length === 0}>
          <span class="mini-key" style={{ color: "var(--color-faint)" }}>no samples yet</span>
        </Show>
      </div>

      <div class="mini-row">
        <button class="btn btn-outline btn-sm" onClick={run} disabled={busy()}>
          {busy() ? "MEASURING…" : "MEASURE"}
        </button>
        <span class="mini-key" style={{ color: "var(--color-faint)" }}>
          both timed by the browser, not by a stopwatch we hold
        </span>
      </div>
    </>
  );
};
