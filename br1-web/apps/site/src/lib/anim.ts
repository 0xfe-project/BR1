import { animate, createTimeline, createTimer, stagger, spring, utils, engine } from "animejs";

export { animate, createTimeline, createTimer, stagger, spring, utils, engine };

/**
 * BR1 eases.
 *
 * The whole motion language is here. `bounce` is overshoot: the amount of
 * physical give the element shows before it settles. Nothing in BR1 uses a
 * duration-based ease for a state change — a state change is instant, and only
 * *motion through space* gets physics.
 */
export const EASE = {
  /** discrete state change: no travel, so no physics — just happens */
  state: "out(2)",
  /** a control returning to rest — small overshoot, like a switch */
  tactile: spring({ bounce: 0.2 }),
  /** panels and dividers coming to rest */
  settle: spring({ bounce: 0.1 }),
  /** data arriving with force: bars slamming into place */
  slam: spring({ bounce: 0.2 }),
  /** numbers ticking up */
  tick: "out(3)",
} as const;

/**
 * The long-form motion BR1 allows.
 *
 * This is a ceiling, not a preference: every spring in the interface settles
 * inside it, and it is deliberately under the 300ms an eased transition would
 * take. A language whose third principle is zero latency cannot demonstrate
 * itself with a slower animation than the one it is arguing with.
 */
export const TRANSFORM_MS = 280;
