import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { springRelease } from "./springRelease";
import "./Button.css";

// keep directive import alive (solid-js tree-shakes unused directives)
const _sr = springRelease;

export type ButtonVariant = "outline" | "primary" | "ghost" | "danger";
export type ButtonSize = "default" | "sm" | "icon";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);

  const variant = () => local.variant ?? "outline";
  const size = () => local.size ?? "default";

  const cls = () => {
    const parts = ["btn", `btn-${variant()}`];
    if (size() === "sm") parts.push("btn-sm");
    if (size() === "icon") parts.push("btn-icon");
    if (local.class) parts.push(local.class);
    return parts.join(" ");
  };

  return (
    <button use:springRelease class={cls()} {...rest}>
      {local.children}
    </button>
  );
};
