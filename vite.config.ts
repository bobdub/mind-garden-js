import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const basePath = mode === "production" ? "/mind-garden-js/" : "/";

  return {
    root: path.resolve(__dirname, "src"),
    base: basePath,
    publicDir: false,
    build: {
      outDir: path.resolve(__dirname, "."),
      emptyOutDir: false,
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
