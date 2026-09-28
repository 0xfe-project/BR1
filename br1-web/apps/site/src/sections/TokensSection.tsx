import { createSignal, For, onMount, type Component } from "solid-js";
import { SectionHead } from "../components/SectionHead";

const RAMP = ["--gray-0","--gray-1","--gray-2","--gray-3","--gray-4","--gray-5","--gray-6","--gray-7","--gray-8","--gray-9"];

const SIGNALS: { token: string; label: string; means: string }[] = [
  { token: "--state-error",   label: "ERROR",   means: "stop · failed · destructive" },
  { token: "--state-warning", label: "PENDING", means: "in flight · waiting · degraded" },
  { token: "--state-success", label: "DONE",    means: "settled · passed · alive" },
  { token: "--state-info",    label: "INFO",    means: "neutral fact · running" },
];

const SEMANTIC = [
  "--color-bg", "--color-bg-solid", "--color-fg", "--color-border",
  "--color-border-strong", "--color-overlay", "--color-muted", "--color-faint", "--color-shadow",
];

export const TokensSection: Component = () => {
  // Values are read back out of the DOM, so a swatch can never disagree with
  // what the browser actually resolved for that token.
  const [resolved, setResolved] = createSignal<Record<string, string>>({});

  onMount(() => {
    const styles = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const t of [...RAMP, ...SIGNALS.map((s) => s.token), ...SEMANTIC]) {
      next[t] = styles.getPropertyValue(t).trim() || "—";
    }
    setResolved(next);
  });

  const val = (t: string) => resolved()[t] ?? "…";

  return (
    <section id="tokens" class="sec">
      <SectionHead index="03" label="TOKENS" note="read back from the running document" />

      <p class="sec-lede">
        Lightness and chroma are set explicitly in OKLCH rather than typed as hex. Saturation is
        reserved for signals — <em>a colour with no message does not belong on the screen</em>.
      </p>

      <div>
        <div class="ml" style={{ "margin-bottom": "8px" }}>NEUTRAL RAMP</div>
        <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(110px, 1fr))" }}>
          <For each={RAMP}>{(t) => (
            <div class="spec-cell" style={{ padding: "0" }}>
              <div style={{ height: "56px", background: `var(${t})` }} />
              <div style={{ padding: "8px 10px", "border-top": "1px solid var(--color-border)" }}>
                <div class="ml">{t.replace("--", "")}</div>
                <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--color-muted)", "margin-top": "2px" }}>
                  {val(t)}
                </div>
              </div>
            </div>
          )}</For>
        </div>
      </div>

      <div>
        <div class="ml" style={{ "margin-bottom": "8px" }}>SIGNALS — THE ONLY SATURATION ON THE PAGE</div>
        <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <For each={SIGNALS}>{(s) => (
            <div class="spec-cell">
              <div class="spec-cell-head">
                <span class="ml" style={{ color: `var(${s.token})` }}>{s.label}</span>
                <span class="spec-cell-note">{val(s.token)}</span>
              </div>
              <div style={{ height: "8px", background: `var(${s.token})` }} />
              <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--color-muted)", "letter-spacing": "0.04em" }}>
                {s.means}
              </div>
              <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", "letter-spacing": "0.08em" }}>
                <span style={{ color: `var(${s.token})`, "font-weight": "700" }}>{s.token.replace("--", "")}</span>
              </div>
            </div>
          )}</For>
        </div>
      </div>

      <div>
        <div class="ml" style={{ "margin-bottom": "8px" }}>SEMANTIC SURFACES</div>
        <div class="ptable">
          <For each={SEMANTIC}>{(t) => (
            <div class="ptable-row" style={{ "grid-template-columns": "1fr auto" }}>
              <span style={{ display: "flex", "align-items": "center", gap: "8px", color: "var(--color-muted)" }}>
                <span style={{ width: "10px", height: "10px", background: `var(${t})`, border: "1px solid var(--color-border-strong)", "flex-shrink": "0" }} />
                {t.replace("--", "")}
              </span>
              <span style={{ color: "var(--color-fg)", "font-weight": "700" }}>{val(t)}</span>
            </div>
          )}</For>
        </div>
      </div>
    </section>
  );
};
