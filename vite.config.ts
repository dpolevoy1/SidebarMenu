import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ship TS + CSS modules from Git — let Vite transform instead of pre-bundling.
  optimizeDeps: {
    exclude: ["@assemble/design-system"],
  },
});
