const fs = require('fs');
const path = require('path');

// Backup the original config
const originalConfig = fs.readFileSync('./vite.config.ts', 'utf8');
fs.writeFileSync('./vite.config.ts.backup', originalConfig, 'utf8');

// Create a local-friendly version by replacing import.meta.dirname with __dirname
const localConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Use __dirname for local development
const projectRoot = __dirname;

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Cartographer and other Replit plugins are removed for local development
  ],
  resolve: {
    alias: {
      "@db": path.resolve(projectRoot, "db"),
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
    },
  },
  root: path.resolve(projectRoot, "client"),
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
  },
});`;

fs.writeFileSync('./vite.config.ts', localConfig, 'utf8');

console.log('Vite config adjusted for local development');
console.log('The original file has been backed up to vite.config.ts.backup');