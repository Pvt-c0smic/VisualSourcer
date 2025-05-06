import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup the original config
const originalConfig = fs.readFileSync('./vite.config.ts', 'utf8');
fs.writeFileSync('./vite.config.ts.backup', originalConfig, 'utf8');

// Create a local-friendly version by replacing import.meta.dirname with __dirname
const localConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Get current filename and directory using ESM compatible approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    // Replit plugins are removed for local development
  ],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});`;

fs.writeFileSync('./vite.config.ts', localConfig, 'utf8');

console.log('Vite config adjusted for local development');
console.log('The original file has been backed up to vite.config.ts.backup');