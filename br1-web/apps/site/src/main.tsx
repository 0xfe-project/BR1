import { render } from "solid-js/web";
import { App } from "./App";
import "./styles/base.css";
import "./styles/site.css";
// last: the staged decorative→BR1 rules must outrank the component styles
import "./components/demolition-stage.css";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found");

render(() => <App />, root);
