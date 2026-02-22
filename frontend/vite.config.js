import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Allows external tunneling like ngrok/localtunnel for Web Speech API HTTPS testing
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
      "/lingo-api": {
        target: "https://engine.lingo.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lingo-api/, ""),
      },
    },
  },
});
