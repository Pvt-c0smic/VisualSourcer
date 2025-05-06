import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const serverIndexPath = path.join(__dirname, 'server', 'index.ts');
const backupPath = path.join(__dirname, 'server', 'index.ts.backup');

// Restore the original server/index.ts if backup exists
if (fs.existsSync(backupPath)) {
  console.log('Restoring original server/index.ts...');
  fs.copyFileSync(backupPath, serverIndexPath);
  console.log('Server configuration restored for Replit deployment');
} else {
  console.log('No backup found. Cannot restore server configuration.');
}