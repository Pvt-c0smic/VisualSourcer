import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original Replit configuration from backup if it exists
if (fs.existsSync('./vite.config.ts.backup')) {
  console.log('Restoring from backup...');
  fs.copyFileSync('./vite.config.ts.backup', './vite.config.ts');
  console.log('Original Replit configuration has been restored');
} else {
  // Create a fresh Replit-compatible version
  console.log('Creating fresh Replit configuration...');
  const replitConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import cartographer from "@replit/vite-plugin-cartographer";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import themes from "@replit/vite-plugin-shadcn-theme-json";

export default defineConfig({
  plugins: [
    react(),
    cartographer(),
    runtimeErrorOverlay(),
    themes(),
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});`;
  
  fs.writeFileSync('./vite.config.ts', replitConfig, 'utf8');
  console.log('Replit configuration has been created');
}