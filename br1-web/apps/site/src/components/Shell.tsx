import { createSignal, onMount, onCleanup, For, type JSX } from "solid-js";
import { animate, spring, utils } from "animejs";
import { Nav } from "./Nav";
import { SpecPanel } from "./SpecPanel";
import { ThemeToggle } from "./ThemeToggle";
import { metrics, startMetrics } from "../lib/metrics";
import { buildTimeline, state, transport, useRegion } from "../lib/demolition";
import { SECTIONS } from "../lib/sections";
import "./shell.css";

interface ShellProps {
  children: JSX.Element;
}

const MIN_W = 140;
const MAX_NAV = 320;
const MAX_SPEC = 380;
const SNAP = 8;

export function Shell(props: ShellProps) {
  const [navW, setNavW] = createSignal(178);
  const [specW, setSpecW] = createSignal(226);
  const [active, setActive] = createSignal(SECTIONS[0].id);

  let shellEl!: HTMLDivElement;
  let hostEl!: HTMLElement;
  let stopMetrics: (() => void) | undefined;

  const navRef = useRegion("nav");
  const specRef = useRegion("spec");
  // the page's own hardness: the gradient wash lifts across the whole sequence
  const rootRef = useRegion("root");

  onMount(() => {
    stopMetrics = startMetrics();

    // The page-wide demolition. Built once, here, because this is the outermost
    // component that every region lives inside — a region that mounted earlier
    // has already applied `--hard: 0` and will pick up the rest on the first emit.
    buildTimeline();
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      window.setTimeout(() => transport.play(), 500);
    } else {
      transport.seek(1);
    }

    // Active section is read off the DOM, not guessed: an IntersectionObserver
    // against the scroll host. Same rule as the rest of the panel.
    const sections = Array.from(hostEl.querySelectorAll("section[id]"));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { root: hostEl, threshold: [0.25, 0.5, 0.75], rootMargin: "-10% 0px -40% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    onCleanup(() => {
      io.disconnect();
      stopMetrics?.();
    });
  });

  /** Runs one spring to settle a width onto the 8px grid. */
  function settle(v: number, set: (n: number) => void) {
    const target = Math.round(v / SNAP) * SNAP;
    const proxy = { v };
    animate(proxy, {
      v: target,
      duration: 300,
      ease: spring({ bounce: 0.3 }),
      onUpdate: () => set(proxy.v),
    });
  }

  function startDrag(side: "left" | "right", e: PointerEvent) {
    e.preventDefault();
    const divider = e.currentTarget as HTMLElement;
    divider.setAttribute("data-dragging", "");
    try { divider.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }

    const startX = e.clientX;
    const startW = side === "left" ? navW() : specW();
    const max = side === "left" ? MAX_NAV : MAX_SPEC;

    // The move/up listeners live on the window, not on the 6px gutter: once the
    // pointer leaves a narrow hit area mid-drag, an element-scoped listener
    // stops hearing it and the panel sticks.
    const move = (ev: PointerEvent) => {
      const dx = side === "left" ? ev.clientX - startX : startX - ev.clientX;
      const next = utils.clamp(startW + dx, MIN_W, max);
      (side === "left" ? setNavW : setSpecW)(next);
    };

    const up = () => {
      divider.removeAttribute("data-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      settle(side === "left" ? navW() : specW(), side === "left" ? setNavW : setSpecW);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function jumpTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      class="shell"
      ref={(el) => { shellEl = el; rootRef(el); }}
      style={{ "--nav-w": `${navW()}px`, "--spec-w": `${specW()}px` }}
    >
      {/* Narrow viewports lose the two side columns, so the same navigation
          reappears as a horizontal strip. Same items, same order, same state. */}
      <div class="shell-narrowbar">
        <span class="nav-brand">BR1</span>
        <div class="shell-narrowbar-tabs">
          <For each={SECTIONS}>{(s) => (
            <button
              class="tab"
              data-active={active() === s.id ? "" : undefined}
              onClick={() => jumpTo(s.id)}
            >{s.label}</button>
          )}</For>
        </div>
        <ThemeToggle compact />
      </div>

      <nav class="shell-nav" ref={navRef}>
        <Nav active={active()} onSelect={jumpTo} nodeCount={metrics.nodes()} />
      </nav>

      <div class="shell-div shell-div--left" onPointerDown={(e) => startDrag("left", e)} />

      <main class="shell-main" ref={(el) => (hostEl = el)}>
        {props.children}
      </main>

      <div class="shell-div shell-div--right" onPointerDown={(e) => startDrag("right", e)} />

      <aside class="shell-spec" ref={specRef}>
        <SpecPanel active={active()} />
      </aside>
    </div>
  );
}
