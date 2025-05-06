import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const viteFilePath = path.join(__dirname, 'server', 'vite.ts');
const backupPath = path.join(__dirname, 'server', 'vite.ts.backup');

// Restore the original server/vite.ts if backup exists
if (fs.existsSync(backupPath)) {
  console.log('Restoring original server/vite.ts...');
  fs.copyFileSync(backupPath, viteFilePath);
  console.log('Vite server configuration restored for Replit deployment');
} else {
  console.log('No backup found. Cannot restore vite server configuration.');
}