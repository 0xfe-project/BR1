export interface Section {
  id: string;
  label: string;
  /** what you get in this section, in three words or fewer */
  meta: string;
}

/**
 * The site's own navigation. BR1 is a general design language, so the specimen
 * it is demonstrated on is a generic settings surface — not any one product.
 */
export const SECTIONS: Section[] = [
  { id: "demolition",    label: "DEMOLITION",    meta: "the argument" },
  { id: "typography",    label: "TYPOGRAPHY",    meta: "weight × style" },
  { id: "tokens",        label: "TOKENS",        meta: "oklch ramp" },
  { id: "motion",        label: "MOTION",        meta: "springs, live" },
  { id: "components",    label: "COMPONENTS",    meta: "full state matrix" },
  { id: "observability", label: "OBSERVABILITY", meta: "real vs. decorative" },
];
