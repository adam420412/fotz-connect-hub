import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The package's browser entry is UMD; select its ESM build so the
      // default import remains a React component under Vite 8.
      "lottie-react": fileURLToPath(new URL("./node_modules/lottie-react/build/index.es.js", import.meta.url)),
    },
  },
}));
