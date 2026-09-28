import { createSignal, onMount, onCleanup } from "solid-js";

/**
 * springRelease directive
 *
 * Gives any element a mechanical two-stage feel:
 *  - hover  → pre-travel (CSS handles via :hover)
 *  - press  → instant translate-down + color invert
 *  - release → spring back with overshoot via Web Animations API
 *
 * Usage: <button use:springRelease>CLICK</button>
 */
export function springRelease(el: HTMLElement) {
  const SPRING = [0.34, 1.56, 0.64, 1] as const;

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    el.setAttribute("data-pressed", "");
  }

  function onPointerUp() {
    if (!el.hasAttribute("data-pressed")) return;
    el.removeAttribute("data-pressed");
    // spring back with overshoot
    el.animate(
      [
        { transform: "translateY(2px)" },
        { transform: "translateY(-1px)" },
        { transform: "translateY(0px)" },
      ],
      {
        duration: 220,
        easing: `cubic-bezier(${SPRING.join(",")})`,
        fill: "none",
      },
    );
  }

  function onPointerCancel() {
    el.removeAttribute("data-pressed");
  }

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerCancel);

  onCleanup(() => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerCancel);
  });
}

// Solid directive type augmentation
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      springRelease: true;
    }
  }
}
