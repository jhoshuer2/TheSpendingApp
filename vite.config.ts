/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
      manifest: {
        name: "SPAL",
        short_name: "SPAL",
        description: "A personal business companion that shows you the next step.",
        lang: "en-NG",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0C110F",
        theme_color: "#F6F6F1",
        icons: [
          { src: "icons/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ttf,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
