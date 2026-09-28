import type { Component } from "solid-js";
import { Shell } from "./components/Shell";
import { SectionHead } from "./components/SectionHead";
import { Demolition } from "./components/Demolition";
import { useRegion } from "./lib/demolition";
import { TypographySection } from "./sections/TypographySection";
import { TokensSection } from "./sections/TokensSection";
import { MotionSection } from "./sections/MotionSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { ObservabilitySection } from "./sections/ObservabilitySection";

/**
 * 01 — the argument, performed. The whole first screen is taken apart, one
 * region at a time, from the decorative language to BR1: rails, claim,
 * specimen, instruments. Nothing else on the page needs to explain it after.
 */
const DemolitionSection: Component = () => {
  const heroRef = useRegion("hero");

  return (
    <section id="demolition" class="sec sec--hero" ref={heroRef}>
      <SectionHead index="01" label="DEMOLITION" note="five regions · one sequence · no library" />

      <div class="dm-hero-wordmark">
        <div class="dm-hero-line1">BR1 DESIGN SYSTEM:</div>
        <div class="dm-hero-line2">DON'T LET CORNERS LIE TO YOU</div>
      </div>

      <div class="dm-hero-body">
        <Demolition />
      </div>
    </section>
  );
};

export const App: Component = () => (
  <Shell>
    <DemolitionSection />
    <TypographySection />
    <TokensSection />
    <MotionSection />
    <ComponentsSection />
    <ObservabilitySection />
  </Shell>
);
