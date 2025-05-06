// This script creates a local development version of the vite.ts file
// that works on Windows and other environments with Node.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file paths
const viteFilePath = path.join(__dirname, 'server', 'vite.ts');
const backupPath = path.join(__dirname, 'server', 'vite.ts.original');

// Create backup if it doesn't exist
if (!fs.existsSync(backupPath)) {
  console.log('Creating backup of original vite.ts...');
  fs.copyFileSync(viteFilePath, backupPath);
}

// Read the current vite.ts content
const originalContent = fs.readFileSync(viteFilePath, 'utf8');

// Create the modified content with direct path resolution
const modifiedContent = `import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Get directory name in a Node.js ESM compatible way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(\`\${formattedTime} [\${source}] \${message}\`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        \`src="/src/main.tsx"\`,
        \`src="/src/main.tsx?v=\${nanoid()}"\`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      \`Could not find the build directory: \${distPath}, make sure to build the client first\`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
`;

// Write the modified content
fs.writeFileSync(viteFilePath, modifiedContent, 'utf8');

console.log('Successfully updated server/vite.ts for local development!');
console.log('The file now uses Node.js compatible path resolution methods.');
console.log('Remember to run "node restore-config.mjs" before pushing to Replit.');

// Create a restore script if it doesn't exist
const restoreFilePath = path.join(__dirname, 'restore-config.mjs');
if (!fs.existsSync(restoreFilePath)) {
  const restoreScript = `// This script restores the original vite.ts file for Replit deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file paths
const viteFilePath = path.join(__dirname, 'server', 'vite.ts');
const backupPath = path.join(__dirname, 'server', 'vite.ts.original');

// Check if backup exists
if (fs.existsSync(backupPath)) {
  console.log('Restoring original vite.ts from backup...');
  fs.copyFileSync(backupPath, viteFilePath);
  console.log('Successfully restored server/vite.ts for Replit deployment!');
} else {
  console.log('Error: Backup file not found. Cannot restore original configuration.');
}
`;
  
  fs.writeFileSync(restoreFilePath, restoreScript, 'utf8');
  console.log('Created restore-config.mjs script to revert changes when needed.');
}