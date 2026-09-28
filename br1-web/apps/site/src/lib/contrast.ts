/**
 * Real contrast maths, measured the only way that survives every colour format.
 *
 * `getComputedStyle` hands back whatever the declarations used — this project
 * declares OKLCH, so a regex looking for `rgb()` finds nothing. A 1×1 canvas
 * normalises anything the browser understands (oklch, color(), hex, alpha)
 * into the sRGB bytes that were actually going to be painted, and compositing
 * onto the background first means an alpha colour is measured as it appears,
 * not as it was written.
 */

let probeCtx: CanvasRenderingContext2D | null | undefined;

function ctx(): CanvasRenderingContext2D | null {
  if (probeCtx === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probeCtx = canvas.getContext("2d", { willReadFrequently: true });
  }
  return probeCtx;
}

/** Paints the colours in order onto one pixel and reads back what landed there. */
function composite(colors: string[]): [number, number, number] {
  const c = ctx();
  if (!c) return [0, 0, 0];
  c.clearRect(0, 0, 1, 1);
  for (const color of colors) {
    c.fillStyle = "#000";  // an unparseable colour leaves the previous value intact
    c.fillStyle = color;
    c.fillRect(0, 0, 1, 1);
  }
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between a background and a foreground painted over it. */
export function contrastOver(background: string, foreground: string): number {
  const bg = composite([background]);
  const fg = composite([background, foreground]);
  const lb = luminance(bg);
  const lf = luminance(fg);
  const hi = Math.max(lb, lf);
  const lo = Math.min(lb, lf);
  return (hi + 0.05) / (lo + 0.05);
}

/** The colour the document actually sits on. */
export function pageBackground(): string {
  const html = getComputedStyle(document.documentElement).backgroundColor;
  if (html && html !== "rgba(0, 0, 0, 0)") return html;
  return getComputedStyle(document.body).backgroundColor || "#ffffff";
}

export function grade(ratio: number): { label: string; tone: string } {
  if (ratio >= 7) return { label: "AAA", tone: "var(--state-success)" };
  if (ratio >= 4.5) return { label: "AA", tone: "var(--state-success)" };
  if (ratio >= 3) return { label: "AA-LARGE", tone: "var(--state-warning)" };
  return { label: "FAIL", tone: "var(--state-error)" };
}
