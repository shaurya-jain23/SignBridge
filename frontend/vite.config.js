import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Lingo.dev compiler will be enabled in Phase 2:
    // lingoCompilerPlugin({
    //   sourceRoot: 'src',
    //   sourceLocale: 'en',
    //   targetLocales: ['es', 'hi', 'fr', 'de', 'ja', 'ar', 'zh', 'ko', 'pt'],
    //   models: 'lingo.dev',
    //   dev: { usePseudotranslator: true },
    // }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
});
