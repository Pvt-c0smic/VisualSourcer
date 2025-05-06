// This script is used for deployment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Create a public directory inside dist if it doesn't exist
if (!fs.existsSync(path.join('dist', 'public'))) {
  fs.mkdirSync(path.join('dist', 'public'));
}

// Set environment variables
process.env.NODE_ENV = 'production';

console.log('Starting build process...');

// Build the client
const buildClient = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

buildClient.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed with code', code);
    process.exit(code);
  }

  console.log('Build completed successfully');
  console.log('Starting server in production mode...');

  // Start the server
  const startServer = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  startServer.on('close', (code) => {
    if (code !== 0) {
      console.error('Server exited with code', code);
      process.exit(code);
    }
  });
});