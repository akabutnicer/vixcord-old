import dotenv from "dotenv";
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  define: {
    global: "globalThis",
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      "/server": {
        target: `http://localhost:${4000}`,
        changeOrigin: true,
        secure: false,
      },
      "/backgrounds":  '/backgrounds',
        
      }
    },
  });


