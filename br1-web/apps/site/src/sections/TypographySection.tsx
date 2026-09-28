import { createSignal, For, createEffect, onCleanup, type Component } from "solid-js";
import { SectionHead } from "../components/SectionHead";
import { contrastOver, grade, pageBackground } from "../lib/contrast";
import { mode } from "../lib/theme";

interface Specimen {
  label: string;
  size: string;
  weight: string;
  style: string;
  underline?: boolean;
  mono?: boolean;
  color?: string;
  sample: string;
}

const SPECIMENS: Specimen[] = [
  { label: "DISPLAY",     size: "30px", weight: "700", style: "normal", sample: "Hard edges are a promise" },
  { label: "HEADING",     size: "20px", weight: "700", style: "normal", sample: "Two-stage trigger" },
  { label: "BOLD ITALIC", size: "20px", weight: "700", style: "italic", sample: "Pre-travel, actuation, return" },
  { label: "BODY",        size: "15px", weight: "400", style: "normal", sample: "Density is respect, not clutter." },
  { label: "BODY ITALIC", size: "15px", weight: "400", style: "italic", sample: "metadata · timestamps · aside" },
  { label: "UNDERLINED",  size: "15px", weight: "400", style: "normal", underline: true, sample: "interactive text" },
  { label: "MUTED",       size: "13px", weight: "400", style: "normal", color: "var(--color-muted)", sample: "secondary explanation" },
  { label: "FAINT",       size: "13px", weight: "400", style: "normal", color: "var(--color-faint)", sample: "annotation, third level" },
  { label: "MONO LABEL",  size: "11px", weight: "700", style: "normal", mono: true, sample: "RUNNING_MODEL  CUSTOM-99C215A1" },
  { label: "MONO BODY",   size: "11px", weight: "400", style: "normal", mono: true, sample: "in 3,145 · out 567 · cache 0 · epoch 0" },
  { label: "MICRO LABEL", size: "9px",  weight: "700", style: "normal", mono: true, sample: "SYSTEM PROMPT · PERSONA · TOOL DEFS" },
  { label: "MICRO MUTED", size: "9px",  weight: "400", style: "normal", mono: true, color: "var(--color-faint)", sample: "written by anime.js · measured, not asserted" },
];

export const TypographySection: Component = () => {
  const [ratios, setRatios] = createSignal<Record<string, { ratio: number; label: string; tone: string }>>({});

  // The contrast of each specimen is measured off the rendered element after
  // paint — the same computation a linter would do, run in the page and shown.
  // Re-runs whenever the mode changes, because the answer changes with it.
  //
  // The measurement waits a frame. The class lands synchronously, but this read
  // asks the browser to resolve OKLCH custom properties down to painted sRGB,
  // and that resolution is the browser's to schedule — measuring inside the
  // notification is how the readouts ended up a theme behind.
  createEffect(() => {
    mode();
    const handle = requestAnimationFrame(measure);
    onCleanup(() => cancelAnimationFrame(handle));
  });

  function measure() {
    const bg = pageBackground();
    const next: Record<string, { ratio: number; label: string; tone: string }> = {};
    document.querySelectorAll<HTMLElement>("[data-specimen]").forEach((el) => {
      const key = el.dataset.specimen ?? "";
      const fg = getComputedStyle(el).color;
      const ratio = contrastOver(bg, fg);
      const g = grade(ratio);
      next[key] = { ratio, label: g.label, tone: g.tone };
    });
    setRatios(next);
  }

  return (
    <section id="typography" class="sec">
      <SectionHead index="02" label="TYPOGRAPHY" note="weight × style × decoration × size × colour" />

      <p class="sec-lede">
        You don't need a card to create hierarchy. <em>weight × style × underline × size × colour</em>{" "}
        is a complete system, and the terminal has been using it correctly for forty years.
      </p>

      <div>
        <div class="ml" style={{ "margin-bottom": "8px" }}>
          SPECIMEN MATRIX — contrast measured in-page against the resolved background
        </div>
        <div class="spec-grid" style={{ "grid-template-columns": "1fr" }}>
          <For each={SPECIMENS}>{(s) => (
            <div class="spec-cell" style={{ padding: "8px 14px" }}>
              <div class="type-row">
                <span class="ml ml--faint">{s.label}</span>
                <span
                  data-specimen={s.label}
                  style={{
                    "font-family": s.mono ? "var(--font-mono)" : "var(--font-ui)",
                    "font-size": s.size,
                    "font-weight": s.weight,
                    "font-style": s.style,
                    "text-decoration": s.underline ? "underline" : "none",
                    "text-underline-offset": "3px",
                    color: s.color ?? "var(--color-fg)",
                    "line-height": "1.35",
                  }}
                >{s.sample}</span>
                <span style={{
                  "font-family": "var(--font-mono)", "font-size": "9px", "text-align": "right",
                  "font-variant-numeric": "tabular-nums",
                }}>
                  {(() => {
                    const r = ratios()[s.label];
                    return r
                      ? <>
                          <span style={{ color: "var(--color-fg)", "font-weight": "700" }}>{r.ratio.toFixed(2)}:1</span>{" "}
                          <span style={{ color: r.tone }}>{r.label}</span>
                        </>
                      : <span style={{ color: "var(--color-faint)" }}>measuring…</span>;
                  })()}
                </span>
              </div>
            </div>
          )}</For>
        </div>
      </div>

      <div>
        <div class="ml" style={{ "margin-bottom": "8px" }}>HIERARCHY WITHOUT CONTAINERS</div>
        <div style={{ "max-width": "62ch", "border-left": "2px solid var(--color-border-strong)", "padding-left": "18px" }}>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", "font-weight": "700", "letter-spacing": "0.16em", "text-transform": "uppercase", color: "var(--color-faint)" }}>
            § 1.2 — CONTROLS
          </div>
          <div style={{ "font-size": "22px", "font-weight": "700", "line-height": "1.25", "margin": "6px 0 2px" }}>
            The Mechanical Switch
          </div>
          <div style={{ "font-size": "13px", "font-style": "italic", color: "var(--color-muted)", "margin-bottom": "12px" }}>
            two-stage trigger · pre-travel · actuation point · spring return
          </div>
          <div style={{ "font-size": "15px", "line-height": "1.7" }}>
            Every interactive element must give the user a physical analog. Hover is the pre-travel.
            Press is the actuation point. Release is the spring return. The user should feel the
            keyboard, not the glass.
          </div>
          <div style={{ "font-size": "15px", "line-height": "1.7", "margin-top": "12px", color: "var(--color-muted)" }}>
            Certainty is the goal: <span style={{ "text-decoration": "underline", "text-underline-offset": "3px", color: "var(--color-fg)" }}>I pressed it. I felt it. It happened.</span>
          </div>
          <div style={{ "font-family": "var(--font-mono)", "font-size": "10px", "letter-spacing": "0.08em", "margin-top": "14px", color: "var(--color-faint)" }}>
            NO CARD · NO SHADOW · NO ROUNDED CONTAINER · ZERO PIXELS SPENT ON CHROME
          </div>
        </div>
      </div>
    </section>
  );
};
