import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // the real site uses normal paths (/join); the single-file claude.ai preview keeps #join (see src/lib/site.tsx)
  define: { __PATH_ROUTES__: 'true' },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
