import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

import { ServerOptions } from "https";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const serverConfig: {
    headers: Record<string, string>;
    https?: ServerOptions;
  } = {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  };

  if (command === "serve") {
    const certPath = path.resolve(__dirname, "../../agents/capture-agent-py/localhost.pem");
    const keyPath = path.resolve(__dirname, "../../agents/capture-agent-py/localhost-key.pem");

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      serverConfig.https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    } else {
      console.warn("SSL certificate not found. Starting dev server in HTTP mode.");
      console.warn(
        "Run the agent's 'run.sh' or 'run.bat' script once to generate the certificate.",
      );
    }
  }

  return {
    plugins: [react(), splitVendorChunkPlugin()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: serverConfig,
    assetsInclude: ["**/*.worklet.js"],
    build: {
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            // Split React and core libraries
            react: ["react", "react-dom"],
            // Split UI library chunks
            radix: [
              "@radix-ui/react-slot",
              "@radix-ui/react-popover",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
            ],
            // Split heavy utility libraries
            utils: ["lodash", "date-fns", "clsx", "tailwind-merge"],
            // Split charting/analysis libraries
            charts: ["recharts", "d3"],
          },
          // Ensure worklet files are treated as assets
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.includes("RtaWorkletProcessor")) {
              return "assets/worklets/[name].[hash][extname]";
            }
            return "assets/[name].[hash][extname]";
          },
        },
      },
      // Increase chunk size warning limit to reduce noise
      chunkSizeWarningLimit: 900,
    },
  };
});
