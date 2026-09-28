import { For, type Component } from "solid-js";
import { mode, setMode, type Mode } from "../lib/theme";

/**
 * Not an icon. Two words, both states always visible, the active one inverted.
 * There is no sun and no moon in this language — a control says what it does.
 */
export const ThemeToggle: Component<{ compact?: boolean }> = (props) => {
  const options: Mode[] = ["dark", "light"];

  return (
    <div
      role="group"
      aria-label="colour mode"
      style={{
        display: "inline-flex",
        border: "1px solid var(--color-border-strong)",
      }}
    >
      <For each={options}>{(m) => {
        const active = () => mode() === m;
        return (
          <button
            type="button"
            aria-pressed={active()}
            onClick={() => setMode(m)}
            style={{
              "font-family": "var(--font-mono)",
              "font-size": "8px",
              "font-weight": "700",
              "letter-spacing": "0.14em",
              "text-transform": "uppercase",
              padding: props.compact ? "2px 6px" : "3px 7px",
              border: "0",
              "border-right": m === "dark" ? "1px solid var(--color-border-strong)" : "0",
              background: active() ? "var(--color-fg)" : "transparent",
              color: active() ? "var(--color-bg)" : "var(--color-muted)",
              cursor: "pointer",
              "line-height": "1.2",
            }}
          >{m}</button>
        );
      }}</For>
    </div>
  );
};
