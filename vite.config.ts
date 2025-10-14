import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // 🧹 Removed @replit/vite-plugin-runtime-error-modal
    // (was causing "Failed to parse JSON file" error in dev)
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  root: path.resolve(__dirname, "client"),

  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    host: "0.0.0.0",   // ✅ Access from LAN / mobile
    port: 5173,        // ✅ Frontend port
    fs: {
      strict: true,
      deny: ["**/.*"], // 🚫 Prevent serving hidden files
    },
    proxy: {
      "/api": {
        target: "http://localhost:5050", // ✅ Your Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ✅ Optional: cleaner build logging
  logLevel: "info",
});
