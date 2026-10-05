import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'none'",
].join("; ");

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "csp-prod",
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
        );
      },
    },
  ],
  test: {
    environment: "node",
  },
});

