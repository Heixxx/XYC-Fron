import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// Plugin: remove crossorigin attributes from generated HTML
function removeCrossorigin() {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), removeCrossorigin()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable module preload to avoid CORS issues with crossorigin
    modulePreload: false,
  },
});
