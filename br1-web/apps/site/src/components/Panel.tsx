import type { Component, JSX } from "solid-js";

interface PanelProps {
  /** the window's title bar, in the language's own voice */
  title: string;
  /** right-aligned note: what you are looking at, or how it is made */
  note?: string;
  /** the title bar carries the square window controls */
  chrome?: boolean;
  children: JSX.Element;
  class?: string;
  bodyStyle?: JSX.CSSProperties;
}

/**
 * A BR1 window. Title bar, 1px rule, body — the whole shape is three
 * declarations, because the chrome is meant to be read, not admired.
 *
 * The square controls are decorative here: they are the language's opening
 * argument (everything macOS does soft, BR1 does hard), not a working window
 * manager. They are aria-hidden so nobody tabs into them.
 */
export const Panel: Component<PanelProps> = (props) => (
  <section class={`panel ${props.class ?? ""}`}>
    <header class="panel-bar">
      {props.chrome && (
        <span class="panel-lights" aria-hidden="true">
          <i data-l="close" />
          <i data-l="min" />
          <i data-l="max" />
        </span>
      )}
      <span class="panel-title">{props.title}</span>
      {props.note && <span class="panel-note">{props.note}</span>}
    </header>
    <div class="panel-body" style={props.bodyStyle}>
      {props.children}
    </div>
  </section>
);
