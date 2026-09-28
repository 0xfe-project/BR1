import { createSignal, onCleanup, onMount } from "solid-js";
import { createTimeline, spring } from "animejs";

/* ---------------------------------------------------------------------------
 * The demolition, as one timeline over the whole first screen.
 *
 * Every region of the page has a "hardness": 0 is the decorative language
 * (rounded, filled, softly shadowed, sentence case), 1 is BR1 (square, ruled,
 * mono, uppercase). One object holds them, one timeline walks through them in
 * order, and each region paints its own attribute from it. Nothing else needs
 * to know that a sequence exists.
 * ------------------------------------------------------------------------- */

export const HARD = { root: 0, nav: 0, hero: 0, spec: 0, card: 0, controls: 0 };
export type RegionKey = keyof typeof HARD;

/** The order the page is taken apart in: rails first, then the claim, then the evidence. */
export const REGION_ORDER: RegionKey[] = ["nav", "hero", "spec", "card", "controls"];

/**
 * The specimen's own detail — cleared radius, collapsed blur, opened spacing —
 * which the readout panel reads. `track` is this region's hardness.
 */
export const LIVE = {
  rCard: 16, rEl: 8, shY: 8, shBlur: 24, hard: 0,
  pad: 22, gap: 14, ts: 18, bs: 13, track: 0,
};

const FRESH_LIVE = { ...LIVE };

/** How long one region takes. Everything else is derived from it. */
export const REGION_MS = 820;
/** How much the next region starts before the previous one ends. */
const OVERLAP = 150;

const [progress, setProgress] = createSignal(0);
const [running, setRunning] = createSignal(false);
export const state = { progress, running };

/** A reactive mirror of HARD, so a panel can render the sequence while it runs. */
const [regions, setRegions] = createSignal({ ...HARD });
export { regions };

type Listener = () => void;
const listeners = new Set<Listener>();

/** Regions call this to be repainted whenever the sequence moves. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit() {
  setRegions({ ...HARD });
  for (const fn of listeners) fn();
}

const ease = () => spring({ bounce: 0.12 });

let tl: ReturnType<typeof createTimeline> | undefined;

function resetState() {
  Object.assign(LIVE, FRESH_LIVE);
  for (const key of Object.keys(HARD) as RegionKey[]) HARD[key] = 0;
}

export function buildTimeline() {
  resetState();

  tl = createTimeline({
    autoplay: false,
    onBegin: () => setRunning(true),
    onComplete: () => { setRunning(false); emit(); },
    onUpdate: (self: { progress: number }) => {
      // the specimen's own track is what "card" hardness means
      HARD.card = LIVE.track;
      // the page itself: the wash lifts as the demolition proceeds, so the
      // background is the first thing to stop being decorative and the last to finish
      const p = self.progress ?? 0;
      HARD.root = p;
      setProgress(p);
      emit();
    },
  });

  // 1 · the left rail
  tl.add(HARD, { nav: 1, duration: REGION_MS, ease: ease() }, 0);
  // 2 · the claim
  tl.add(HARD, { hero: 1, duration: REGION_MS * 0.7, ease: ease() }, `-=${OVERLAP}`);
  // 3 · the right rail
  tl.add(HARD, { spec: 1, duration: REGION_MS, ease: ease() }, `-=${OVERLAP}`);
  // 4 · the specimen, in two beats: geometry gives way, then structure arrives
  tl.add(LIVE, { rCard: 0, rEl: 0, shBlur: 0, duration: 340, ease: "out(3)" }, `-=${OVERLAP}`);
  tl.add(LIVE, {
    hard: 1, shY: 4, pad: 12, gap: 6, ts: 11, bs: 11, track: 1,
    duration: 600, ease: ease(),
  }, `-=${OVERLAP}`);
  // 5 · the instruments
  tl.add(HARD, { controls: 1, duration: REGION_MS * 0.6, ease: ease() }, `-=${OVERLAP}`);

  return tl;
}

/** Repaint everything from the current state — used after a seek, which does not
 *  promise to run a tween's onUpdate, and so leaves HARD holding whatever the
 *  last played frame wrote. */
export function repaint(fraction?: number) {
  HARD.card = LIVE.track;
  if (fraction !== undefined) HARD.root = fraction;
  emit();
}

function timelineDuration(): number {
  return (tl as unknown as { duration?: number })?.duration ?? 1;
}

export const transport = {
  play(): void { tl?.play(); },
  reverse(): void { tl?.reverse(); },
  pause(): void { tl?.pause(); },
  restart(): void { tl?.restart(); },
  at(ms: number): void {
    tl?.seek(ms);
    repaint(ms / Math.max(1, timelineDuration()));
  },
  seek(fraction: number): void {
    const f = Math.min(1, Math.max(0, fraction));
    tl?.pause();
    tl?.seek(timelineDuration() * f);
    setProgress(f);
    repaint(f);
  },
  duration: timelineDuration,
};

/**
 * Binds a region.
 *
 * Everything discrete goes out as a custom property rather than an attribute
 * class. A `[data-hard="deco"] .thing` rule outranks `.thing` and matches
 * *through* any nested region, so an inner region that had already switched
 * would be dragged back by its parent's selector. Custom properties inherit and
 * a nested region simply overrides them — no specificity to lose.
 */
export function useRegion(key: RegionKey) {
  let el: HTMLElement | undefined;

  const apply = () => {
    if (!el) return;
    const value = HARD[key];
    const deco = value <= 0.5;
    el.style.setProperty("--hard", String(value));
    el.style.setProperty("--ui-font", deco ? "var(--font-ui)" : "var(--font-mono)");
    el.style.setProperty("--ui-case", deco ? "lowercase" : "uppercase");
    el.style.setProperty("--ui-weight", deco ? "500" : "700");
    el.style.setProperty("--ui-track", deco ? "0em" : "0.12em");
    el.style.setProperty("--ui-accent", deco ? "var(--deco-accent)" : "var(--color-fg)");
    el.style.setProperty("--ui-ink", deco ? "var(--deco-ink)" : "var(--color-fg)");
  };

  onMount(() => {
    apply();
    const off = subscribe(apply);
    onCleanup(off);
  });

  return (node: HTMLElement) => { el = node; apply(); };
}
