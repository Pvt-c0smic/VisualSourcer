import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup the original server/index.ts if not already backed up
const serverIndexPath = path.join(__dirname, 'server', 'index.ts');
const backupPath = path.join(__dirname, 'server', 'index.ts.backup');

if (!fs.existsSync(backupPath)) {
  console.log('Backing up original server/index.ts...');
  fs.copyFileSync(serverIndexPath, backupPath);
}

// Read the server index file
let serverIndex = fs.readFileSync(serverIndexPath, 'utf8');

// Replace the port configuration
serverIndex = serverIndex.replace(
  `  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;`,
  `  // For local Windows development, use a higher port number to avoid permission issues
  // In Replit, always use port 5000
  const port = process.platform === 'win32' ? 3000 : 5000;`
);

// Write the modified file
fs.writeFileSync(serverIndexPath, serverIndex, 'utf8');

console.log('Server configuration adjusted for Windows development');
console.log('The server will now run on port 3000 locally');
console.log('Access your app at http://localhost:3000 when it starts');