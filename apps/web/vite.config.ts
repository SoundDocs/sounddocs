import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "../../agents/capture-agent-py/localhost-key.pem"),
      ),
      cert: fs.readFileSync(path.resolve(__dirname, "../../agents/capture-agent-py/localhost.pem")),
    },
  },
  assetsInclude: ["**/*.worklet.js"],
  build: {
    rollupOptions: {
      external: [],
      output: {
        // Ensure worklet files are treated as assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes("RtaWorkletProcessor")) {
            return "assets/worklets/[name].[hash][extname]";
          }
          return "assets/[name].[hash][extname]";
        },
      },
    },
  },
});
