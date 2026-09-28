import { createSignal } from "solid-js";

/**
 * Real measurements of the page you are currently looking at.
 *
 * Not a demo. Not a pulse animation. This is a requestAnimationFrame loop
 * timing itself and reading the DOM, so every number in the spec panel is a
 * fact about the running document.
 */

const [fps, setFps] = createSignal(0);
const [frameMs, setFrameMs] = createSignal(0);
const [jank, setJank] = createSignal(0);
const [nodes, setNodes] = createSignal(0);
const [domDepth, setDomDepth] = createSignal(0);
/** False until a full window of frames exists — before that there is no average to report. */
const [sampled, setSampled] = createSignal(false);

/**
 * rAF does not run in a hidden tab. Rather than let the last good value sit
 * there looking live, the panel is told so it can stop claiming to measure.
 */
const [visible, setVisible] = createSignal(true);

export const metrics = { fps, frameMs, jank, nodes, domDepth, sampled, visible };

/** Rolling window of the last N frame durations. */
const WINDOW = 60;
let frames: number[] = [];
let last = 0;
let rafId = 0;
let slowFrameCount = 0;

function maxDepth(node: Element, depth = 0): number {
  let deepest = depth;
  for (const child of Array.from(node.children)) {
    const d = maxDepth(child, depth + 1);
    if (d > deepest) deepest = d;
  }
  return deepest;
}

function loop(now: number) {
  if (last !== 0) {
    const dt = now - last;
    frames.push(dt);
    if (frames.length > WINDOW) frames.shift();
    // a frame slower than 60Hz budget + slack counts as jank
    if (dt > 20) slowFrameCount++;
  }
  last = now;

  if (frames.length === WINDOW) {
    const sum = frames.reduce((a, b) => a + b, 0);
    const avg = sum / frames.length;
    setFrameMs(avg);
    setFps(Math.round(1000 / avg));
    setSampled(true);
  }

  rafId = requestAnimationFrame(loop);
}

let started = false;

export function startMetrics() {
  if (started) return;
  started = true;
  requestAnimationFrame(loop);

  const onVisibility = () => {
    const isVisible = document.visibilityState === "visible";
    setVisible(isVisible);
    if (isVisible) {
      // the gap across a hidden period is not a frame; measuring it would
      // report a multi-second "frame" the moment the tab comes back
      frames = [];
      last = 0;
      setSampled(false);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // DOM facts change slowly; reading them once a second is plenty and keeps
  // the measuring from becoming the thing being measured.
  const domTicker = setInterval(() => {
    setNodes(document.querySelectorAll("*").length);
    setDomDepth(maxDepth(document.documentElement));
    setJank(slowFrameCount);
    slowFrameCount = 0;
  }, 1000);

  return () => {
    cancelAnimationFrame(rafId);
    clearInterval(domTicker);
    document.removeEventListener("visibilitychange", onVisibility);
    started = false;
  };
}
