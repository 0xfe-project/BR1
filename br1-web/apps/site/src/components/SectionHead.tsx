import { For, type Component } from "solid-js";

interface SectionHeadProps {
  index: string;
  label: string;
  note?: string;
}

export const SectionHead: Component<SectionHeadProps> = (props) => (
  <div class="sec-head">
    <span class="sec-index">{props.index}</span>
    <span class="sec-label">{props.label}</span>
    {props.note && <span class="sec-note">{props.note}</span>}
  </div>
);
