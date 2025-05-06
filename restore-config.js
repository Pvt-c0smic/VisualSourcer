import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Restore the original Replit configuration
if (fs.existsSync('./vite.config.ts.backup')) {
  fs.copyFileSync('./vite.config.ts.backup', './vite.config.ts');
  console.log('Original Replit configuration has been restored');
} else {
  console.error('Backup file not found. Make sure you ran fix-local-dev.js first.');
}