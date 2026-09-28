import { For, type Component } from "solid-js";
import { SECTIONS } from "../lib/sections";
import { ThemeToggle } from "./ThemeToggle";

interface NavProps {
  active: string;
  onSelect: (id: string) => void;
  nodeCount: number;
}

export const Nav: Component<NavProps> = (props) => {
  return (
    <>
      <div class="nav-head">
        <span class="nav-brand">BR1</span>
        <span class="nav-version">v1.0 · ZEN</span>
      </div>

      <div class="nav-list">
        <div class="nav-group">SECTIONS</div>
        <For each={SECTIONS}>{(s) => (
          <button
            class="nav-item"
            data-active={props.active === s.id ? "" : undefined}
            onClick={() => props.onSelect(s.id)}
          >
            <span class="nav-item-label">{s.label}</span>
            <span class="nav-item-meta">{s.meta}</span>
          </button>
        )}</For>

        <div class="nav-group">PRINCIPLES</div>
        {[
          "hard edges = speed",
          "two-stage trigger",
          "zero-latency states",
          "density is respect",
          "color is signal",
          "type is structure",
          "motion is physics",
          "the machine is visible",
        ].map((p, i) => (
          <div class="nav-item" style={{ cursor: "default" }}>
            <span class="nav-item-label" style={{ "font-weight": "400", color: "var(--color-muted)" }}>
              {String(i + 1).padStart(2, "0")} {p}
            </span>
          </div>
        ))}
      </div>

      <div class="nav-foot">
        <div style={{ display: "flex", "align-items": "center", gap: "6px", "margin-bottom": "6px" }}>
          <span style={{ flex: "1" }}>COLOUR MODE</span>
          <ThemeToggle compact />
        </div>
        <div>DOM {props.nodeCount.toLocaleString()} nodes</div>
        <div>no icons · no radius · no easing</div>
      </div>
    </>
  );
};
