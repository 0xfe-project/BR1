import { createSignal, onMount, onCleanup, For, type Component } from "solid-js";
import { animate, spring } from "animejs";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  /** milliseconds for the bars to arrive */
  duration?: number;
  bounce?: number;
  unit?: string;
}

/**
 * A BR1 chart. Raw SVG, no charting library.
 *
 * The rules a library would break, and this does not:
 *   rx = 0 · ry = 0        rectangles, never pills
 *   stroke-linecap: butt  no softened segment ends
 *   no gradient fill       the data is one flat colour
 *   no drop shadow         a chart is not a card
 *   mono axis, 8px         labels are type, not decoration
 *
 * The arrival is physics, not an ease: `spring()` drives one proxy value and
 * every bar reads off it, so the bars share a single law.
 */
export const BarChart: Component<BarChartProps> = (props) => {
  const [progress, setProgress] = createSignal(0);
  let svg!: SVGSVGElement;

  const H = () => props.height ?? 150;
  const PAD_L = 46;
  const PAD_B = 22;
  const PAD_T = 14;
  const BAR_W = 46;

  const innerH = () => H() - PAD_T - PAD_B;
  const max = () => Math.max(...props.data.map((d) => d.value), 1);
  const width = () => PAD_L + props.data.length * BAR_W + (props.data.length - 1) * 8 + 10;

  // grid lines at quarters of the max, labelled with the real value
  const grid = () => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => ({
      y: PAD_T + (i / steps) * innerH(),
      value: Math.round((max() * (steps - i)) / steps),
    }));
  };

  const barX = (i: number) => PAD_L + i * (BAR_W + 8);
  const barH = (v: number) => (v / max()) * innerH();

  onMount(() => {
    const state = { t: 0 };
    const anim = animate(state, {
      t: 1,
      duration: props.duration ?? 300,
      ease: spring({ bounce: props.bounce ?? 0.18 }),
      onUpdate: () => {
        setProgress(state.t);
        // paint imperatively: 6 rects do not need a reactive graph to move
        props.data.forEach((d, i) => {
          const rect = svg.querySelector<SVGRectElement>(`[data-bar="${i}"]`);
          if (!rect) return;
          const h = Math.max(0, barH(d.value) * state.t);
          rect.setAttribute("height", String(h));
          rect.setAttribute("y", String(PAD_T + innerH() - h));
        });
      },
    });
    onCleanup(() => anim.cancel());
  });

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${width()} ${H()}`}
        style={{ overflow: "visible", display: "block", width: "100%", "max-width": `${width()}px`, height: "auto" }}
        role="img"
        aria-label="bar chart"
      >
        <For each={grid()}>{(line) => (
          <>
            <line
              x1={PAD_L} y1={line.y} x2={width() - 10} y2={line.y}
              stroke="var(--color-border)" stroke-width="1" stroke-dasharray="2 3"
            />
            <text
              x={PAD_L - 6} y={line.y + 3} text-anchor="end"
              font-family="var(--font-mono)" font-size="8"
              fill="var(--color-faint)" letter-spacing="0.04em"
            >{line.value}</text>
          </>
        )}</For>

        {/* baseline: solid, because it is the one line that means zero */}
        <line
          x1={PAD_L} y1={PAD_T + innerH()} x2={width() - 10} y2={PAD_T + innerH()}
          stroke="var(--color-border-strong)" stroke-width="1"
        />

        <For each={props.data}>{(d, i) => (
          <>
            <rect
              data-bar={i()}
              x={barX(i())} y={PAD_T + innerH()} width={BAR_W} height={0}
              fill={d.color ?? "var(--color-fg)"} rx={0} ry={0}
            />
            <text
              x={barX(i())} y={PAD_T + innerH() + 13} text-anchor="middle"
              font-family="var(--font-mono)" font-size="8" font-weight="700"
              fill="var(--color-muted)" letter-spacing="0.08em"
            >{d.label}</text>
          </>
        )}</For>
      </svg>

      <div style={{
        display: "flex", gap: "10px", "flex-wrap": "wrap",
        "font-family": "var(--font-mono)", "font-size": "8px",
        color: "var(--color-faint)", "letter-spacing": "0.06em",
      }}>
        <span>SPRING T {progress().toFixed(2)}</span>
        <span>BOUNCE {((props.bounce ?? 0.18) * 100).toFixed(0)}%</span>
        <span>rx=0 · flat fill · no shadow</span>
        {props.unit && <span>UNIT {props.unit}</span>}
      </div>
    </div>
  );
};
