import { createSignal, For, Show, type Component, type JSX } from "solid-js";
import { SectionHead } from "../components/SectionHead";
import { Button } from "../components/Button";

/* --------------------------------------------------------------------------
 * Window chrome — the square traffic lights. Same function as macOS, none of
 * the softness: three 12×12 squares, labels revealed on hover, spring release.
 * ------------------------------------------------------------------------ */
const WindowChrome: Component = () => {
  const [hovered, setHovered] = createSignal(-1);
  const [pressed, setPressed] = createSignal(-1);
  const specs = [
    { color: "var(--state-error)", glyph: "✕", title: "close" },
    { color: "var(--state-warning)", glyph: "_", title: "minimise" },
    { color: "var(--state-success)", glyph: "□", title: "maximise" },
  ];
  return (
    <div style={{ display: "flex", gap: "6px" }} onMouseLeave={() => { setHovered(-1); setPressed(-1); }}>
      <For each={specs}>{(s, i) => (
        <button
          title={s.title}
          aria-label={s.title}
          onMouseEnter={() => setHovered(i())}
          onMouseDown={() => setPressed(i())}
          onMouseUp={() => setPressed(-1)}
          style={{
            width: "12px", height: "12px", padding: "0", border: "0", "border-radius": "0",
            background: s.color, cursor: "pointer",
            display: "flex", "align-items": "center", "justify-content": "center",
            "font-family": "var(--font-mono)", "font-size": "7px", "line-height": "1",
            color: "rgba(0,0,0,0.55)",
            filter: pressed() === i() ? "brightness(0.78)" : hovered() === i() ? "brightness(1.14)" : "none",
            transform: pressed() === i() ? "scale(0.86)" : "none",
            transition: "filter 60ms ease-out, transform 40ms ease-in",
          }}
        >{hovered() === i() ? s.glyph : ""}</button>
      )}</For>
    </div>
  );
};

const States: Component<{ label: string; children: JSX.Element; note?: string }> = (props) => (
  <div style={{ display: "grid", "grid-template-columns": "88px 1fr", gap: "10px", "align-items": "center", padding: "4px 0", "border-bottom": "1px solid var(--color-border)" }}>
    <span class="ml ml--faint">{props.label}</span>
    <div class="row" style={{ gap: "8px" }}>{props.children}</div>
  </div>
);

const Tag: Component<{ tone?: string; children: JSX.Element }> = (props) => (
  <span style={{
    "font-family": "var(--font-mono)", "font-size": "9px", "font-weight": "700",
    "letter-spacing": "0.12em", "text-transform": "uppercase",
    padding: "1px 5px", border: "1px solid currentColor", "border-radius": "0",
    color: props.tone ?? "var(--color-muted)",
  }}>{props.children}</span>
);

export const ComponentsSection: Component = () => {
  const [menuOpen, setMenuOpen] = createSignal(true);
  const [tipOpen, setTipOpen] = createSignal(false);
  const [checked, setChecked] = createSignal(true);
  const [toggle, setToggle] = createSignal(true);

  return (
    <section id="components" class="sec">
      <SectionHead index="05" label="COMPONENTS" note="full state matrix · every state visible at once" />

      <p class="sec-lede">
        Not a component library — a demonstration. Each control below exists to show one decision:
        <em> hard instead of soft, instant instead of eased, type instead of iconography.</em>
      </p>

      <div class="spec-grid" style={{ "grid-template-columns": "repeat(auto-fit, minmax(340px, 1fr))" }}>
        {/* BUTTON MATRIX */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">BUTTON</span>
            <span class="spec-cell-note">4 variants × 4 states</span>
          </div>
          <For each={[
            { v: "outline" as const, label: "OUTLINE" },
            { v: "primary" as const, label: "PRIMARY" },
            { v: "ghost" as const, label: "GHOST" },
            { v: "danger" as const, label: "DANGER" },
          ]}>{(row) => (
            <States label={row.label}>
              <Button variant={row.v}>REST</Button>
              <Button variant={row.v} data-state="hover">HOVER</Button>
              <Button variant={row.v} data-state="active">PRESS</Button>
              <Button variant={row.v} disabled>OFF</Button>
            </States>
          )}</For>
          <div class="row" style={{ "margin-top": "10px" }}>
            <span class="ml ml--faint">SIZES</span>
            <Button variant="outline">DEFAULT</Button>
            <Button variant="outline" size="sm">SMALL</Button>
            <Button variant="outline" size="icon">↩</Button>
          </div>
          <div class="ml ml--faint" style={{ "margin-top": "10px" }}>
            no icons · bold uppercase mono · 60ms hover, 30ms press, spring release
          </div>
        </div>

        {/* WINDOW CHROME + TOGGLE + CHECK */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">WINDOW CHROME</span>
            <span class="spec-cell-note">squares, not circles</span>
          </div>
          <div class="row" style={{ gap: "20px" }}>
            <WindowChrome />
            <span class="ml ml--faint">hover to reveal ✕ _ □</span>
          </div>

          <div class="spec-cell-head" style={{ "margin-top": "12px" }}>
            <span class="ml">TOGGLE · CHECK · RADIO</span>
            <span class="spec-cell-note">square by default</span>
          </div>
          <div class="row" style={{ gap: "18px" }}>
            <button
              onClick={() => setToggle((v) => !v)}
              role="switch"
              aria-checked={toggle()}
              aria-label="enable notifications"
              style={{
                width: "34px", height: "18px", padding: "0", "border-radius": "0", cursor: "pointer",
                background: toggle() ? "var(--state-success)" : "transparent",
                border: `1px solid ${toggle() ? "var(--state-success)" : "var(--color-border-strong)"}`,
                position: "relative",
              }}
            >
              <span style={{
                position: "absolute", top: "2px", left: toggle() ? "16px" : "2px",
                width: "12px", height: "12px", background: toggle() ? "var(--color-bg-solid)" : "var(--color-muted)",
              }} />
            </button>

            <button
              onClick={() => setChecked((v) => !v)}
              role="checkbox"
              aria-checked={checked()}
              aria-label="agree to the terms"
              style={{
                width: "16px", height: "16px", padding: "0", "border-radius": "0", cursor: "pointer",
                border: "1px solid var(--color-border-strong)",
                background: checked() ? "var(--color-fg)" : "transparent",
                color: "var(--color-bg)", "font-family": "var(--font-mono)", "font-size": "11px", "line-height": "1",
              }}
            >{checked() ? "×" : ""}</button>

            <div style={{ display: "flex", gap: "10px" }}>
              <For each={["A", "B", "C"]}>{(l, i) => (
                <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                  <span style={{
                    width: "12px", height: "12px", border: "1px solid var(--color-border-strong)",
                    background: i() === 1 ? "var(--color-fg)" : "transparent",
                  }} />
                  <span class="ml ml--faint">{l}</span>
                </div>
              )}</For>
            </div>
          </div>
        </div>

        {/* INPUT */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">INPUT</span>
            <span class="spec-cell-note">label above, never a placeholder</span>
          </div>
          <div class="stack" style={{ gap: "10px", "max-width": "320px" }}>
            <div class="stack" style={{ gap: "3px" }}>
              <span class="ml">WORKSPACE NAME</span>
              <input class="dm-input" aria-label="workspace name, rest state" style={{ "font-family": "var(--font-mono)", "font-size": "11px", padding: "5px 8px", background: "transparent", "border-color": "var(--color-border-strong)" }} value="br1-design" readOnly />
            </div>
            <div class="stack" style={{ gap: "3px" }}>
              <span class="ml" style={{ color: "var(--color-fg)" }}>FOCUSED</span>
              <input class="dm-input" aria-label="workspace name, focused state" style={{ "font-family": "var(--font-mono)", "font-size": "11px", padding: "5px 8px", background: "transparent", "border-color": "var(--color-fg)" }} value="br1-design" readOnly />
            </div>
            <div class="stack" style={{ gap: "3px" }}>
              <span class="ml" style={{ color: "var(--state-error)" }}>INVALID</span>
              <input class="dm-input" aria-label="workspace name, invalid state" style={{ "font-family": "var(--font-mono)", "font-size": "11px", padding: "5px 8px", background: "transparent", "border-color": "var(--state-error)", color: "var(--state-error)" }} value="br1 design" readOnly />
              <span style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--state-error)" }}>
                names may not contain spaces
              </span>
            </div>
            <div class="stack" style={{ gap: "3px", opacity: "0.4" }}>
              <span class="ml">DISABLED</span>
              <input class="dm-input" aria-label="workspace name, disabled state" style={{ "font-family": "var(--font-mono)", "font-size": "11px", padding: "5px 8px", background: "transparent", "border-color": "var(--color-border)" }} value="locked" readOnly />
            </div>
          </div>
        </div>

        {/* TAGS + MENU + TOOLTIP */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">TAG · MENU · TOOLTIP</span>
            <span class="spec-cell-note">colour is a signal</span>
          </div>

          <div class="row" style={{ gap: "6px" }}>
            <Tag tone="var(--state-error)">ERROR</Tag>
            <Tag tone="var(--state-warning)">PENDING</Tag>
            <Tag tone="var(--state-success)">DONE</Tag>
            <Tag tone="var(--state-info)">RUNNING</Tag>
            <Tag>CANCELLED</Tag>
          </div>

          <div class="row" style={{ gap: "24px", "margin-top": "14px", "align-items": "flex-start" }}>
            <div style={{ position: "relative" }}>
              <Button variant="outline" onClick={() => setMenuOpen((v) => !v)}>
                MENU {menuOpen() ? "↑" : "↓"}
              </Button>
              <Show when={menuOpen()}>
                <div style={{
                  position: "absolute", top: "100%", left: "0", "z-index": "60", "min-width": "150px",
                  background: "var(--color-bg-solid)",
                  border: "2px solid var(--color-border-strong)",
                  "box-shadow": "4px 4px 0 0 var(--color-shadow)",
                }}>
                  <For each={[
                    { label: "OPEN SESSION", tone: "var(--color-fg)" },
                    { label: "FORK", tone: "var(--color-fg)" },
                    { label: "ARCHIVE", tone: "var(--color-muted)" },
                    { label: "DELETE", tone: "var(--state-error)" },
                  ]}>{(item, i) => (
                    <div style={{
                      padding: "5px 10px", cursor: "pointer",
                      "font-family": "var(--font-mono)", "font-size": "10px", "font-weight": "700",
                      "letter-spacing": "0.1em", color: item.tone,
                      "border-bottom": i() < 3 ? "1px solid var(--color-border)" : "none",
                      "box-shadow": i() === 0 ? "inset 2px 0 0 var(--color-fg)" : "none",
                    }}>{item.label}</div>
                  )}</For>
                </div>
              </Show>
            </div>

            <div style={{ position: "relative" }}>
              <Button variant="ghost" onMouseEnter={() => setTipOpen(true)} onMouseLeave={() => setTipOpen(false)}>
                TOOLTIP
              </Button>
              <Show when={tipOpen()}>
                <div style={{
                  position: "absolute", bottom: "100%", left: "0", "margin-bottom": "4px",
                  background: "var(--color-fg)", color: "var(--color-bg)",
                  padding: "2px 7px", "font-family": "var(--font-mono)", "font-size": "9px",
                  "letter-spacing": "0.06em", "white-space": "nowrap",
                }}>0ms delay · no fade · no shadow</div>
              </Show>
            </div>
          </div>
        </div>

        {/* LIST ROWS + PROGRESS */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">LIST ROW</span>
            <span class="spec-cell-note">density is respect</span>
          </div>
          <div style={{ border: "1px solid var(--color-border)" }}>
            <For each={[
              { k: "context window", v: "36,520 / 64,000", t: "var(--state-success)" },
              { k: "system prompt", v: "1,389", t: "var(--color-muted)" },
              { k: "tool definitions", v: "1,574", t: "var(--color-muted)" },
              { k: "cache miss", v: "0", t: "var(--state-warning)" },
              { k: "failed writes", v: "2", t: "var(--state-error)" },
            ]}>{(row) => (
              <div style={{
                display: "flex", gap: "10px", padding: "3px 8px",
                "border-bottom": "1px solid var(--color-border)",
                "font-family": "var(--font-mono)", "font-size": "10px",
              }}>
                <span style={{ flex: "1", color: "var(--color-muted)" }}>{row.k}</span>
                <span style={{ color: row.t, "font-weight": "700", "font-variant-numeric": "tabular-nums" }}>{row.v}</span>
              </div>
            )}</For>
          </div>

          <div class="spec-cell-head" style={{ "margin-top": "12px" }}>
            <span class="ml">PROGRESS</span>
            <span class="spec-cell-note">no radius, no animation</span>
          </div>
          <div class="stack" style={{ gap: "8px" }}>
            <For each={[0.78, 0.34, 1]}>{(pct) => (
              <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                <div style={{ flex: "1", height: "8px", "border": "1px solid var(--color-border-strong)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${pct * 100}%`, background: "var(--color-fg)" }} />
                </div>
                <span class="val" style={{ width: "34px", "text-align": "right" }}>{(pct * 100).toFixed(0)}%</span>
              </div>
            )}</For>
          </div>
        </div>

        {/* DIVIDER — live */}
        <div class="spec-cell">
          <div class="spec-cell-head">
            <span class="ml">DIVIDER</span>
            <span class="spec-cell-note">1px to the eye · 6px to the hand</span>
          </div>
          <div class="ml ml--faint">
            The gutters of this page are these. Drag one: the panel follows the pointer 1:1 with no
            tween, because a resize that animates is a resize that lies about where your cursor is.
            Only the release snaps — onto an 8px grid, with a spring.
          </div>
          <div style={{ height: "1px", background: "var(--color-border)", "margin-top": "10px" }} />
          <div style={{ "font-family": "var(--font-mono)", "font-size": "9px", color: "var(--color-faint)" }}>
            rest: 1px, --color-border · hover: 3px, --color-fg, instant (no transition)
          </div>
        </div>
      </div>
    </section>
  );
};
