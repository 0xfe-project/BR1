import solidGrab from "solid-grab/vite";
import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    // Maps a grabbed element back to its source line. Must run before solid(),
    // which is what erases the JSX it reads. `apply: serve` because the source
    // attributes it injects are a development affordance, not shipped payload.
    solidGrab({ projectRoot: "../..", apply: "serve" }),
    solid(),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
});
