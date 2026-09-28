import { createSignal } from "solid-js";

export type Mode = "dark" | "light";

const KEY = "br1.theme";

function initial(): Mode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* private mode */
  }
  return "dark";
}

const [modeSignal, setModeSignal] = createSignal<Mode>(initial());

export { modeSignal as mode };

/**
 * Light is the base token set in :root; dark is the `.dark` override. Applying
 * a mode is removing or adding one class, and every consumer that reads a token
 * re-resolves on its own — nothing has to be told.
 *
 * Order matters, and it is the whole reason this is one function. Anything
 * subscribing to the signal may read *resolved* style (the contrast readouts in
 * the typography section do exactly that). Writing the class first means those
 * readers always measure the world they have been told about, instead of the
 * one that was on screen a moment ago — which is how the readouts ended up
 * reporting the previous theme's numbers.
 */
export function setMode(next: Mode): void {
  applyMode(next);
  setModeSignal(next);
}

function applyMode(next: Mode): void {
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.classList.toggle("light", next === "light");
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode */
  }
}

export function toggleMode(): void {
  setMode(modeSignal() === "dark" ? "light" : "dark");
}
