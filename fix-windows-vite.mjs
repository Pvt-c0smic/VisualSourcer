import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup the original server/vite.ts if not already backed up
const viteFilePath = path.join(__dirname, 'server', 'vite.ts');
const backupPath = path.join(__dirname, 'server', 'vite.ts.backup');

if (!fs.existsSync(backupPath)) {
  console.log('Backing up original server/vite.ts...');
  fs.copyFileSync(viteFilePath, backupPath);
}

// Read the vite file
let viteFile = fs.readFileSync(viteFilePath, 'utf8');

// Replace import.meta.dirname with Windows-compatible path resolution
viteFile = viteFile.replace(
  `import express, { type Express } from "express";
import fs from "fs";
import path from "path";`,
  `import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in a way that works in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);`
);

// Replace import.meta.dirname with __dirname
viteFile = viteFile.replace(
  `const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );`,
  `const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );`
);

// Replace the second instance in serveStatic function
viteFile = viteFile.replace(
  `const distPath = path.resolve(import.meta.dirname, "public");`,
  `const distPath = path.resolve(__dirname, "public");`
);

// Write the modified file
fs.writeFileSync(viteFilePath, viteFile, 'utf8');

console.log('Vite server file adjusted for Windows development');
console.log('Path resolution now uses Node.js compatible methods');