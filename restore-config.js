const fs = require('fs');

// Restore the original Replit configuration
if (fs.existsSync('./vite.config.ts.backup')) {
  fs.copyFileSync('./vite.config.ts.backup', './vite.config.ts');
  console.log('Original Replit configuration has been restored');
} else {
  console.error('Backup file not found. Make sure you ran fix-local-dev.js first.');
}