# Local Development Setup

This guide will help you set up the application for local development.

## Windows-Specific Instructions

If you're developing on Windows, follow the instructions in [WINDOWS_DEVELOPMENT.md](./WINDOWS_DEVELOPMENT.md).

## General Setup

1. Ensure you have Node.js v16+ and npm installed.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up a PostgreSQL database and configure the connection string:
   ```bash
   # Linux/Mac
   export DATABASE_URL=postgresql://username:password@localhost:5432/databasename
   
   # Windows CMD
   set DATABASE_URL=postgresql://username:password@localhost:5432/databasename
   
   # Windows PowerShell
   $env:DATABASE_URL = "postgresql://username:password@localhost:5432/databasename"
   ```

4. (Optional) For AI features, set your OpenAI API Key:
   ```bash
   # Linux/Mac
   export OPENAI_API_KEY=your_api_key_here
   
   # Windows CMD
   set OPENAI_API_KEY=your_api_key_here
   
   # Windows PowerShell
   $env:OPENAI_API_KEY = "your_api_key_here"
   ```

5. If you encounter any path resolution or module import issues, use the fix-local-dev.mjs script:
   ```bash
   node fix-local-dev.mjs
   ```
   This will create a version of the server/vite.ts file that's compatible with local development.

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Access the application at http://localhost:5000 (or port 3000 on Windows after running fix-windows-port.mjs)

## Resetting Changes for Replit Deployment

Before pushing your changes back to Replit, make sure to restore any configuration files you modified for local development:

```bash
node restore-config.mjs # If you ran fix-local-dev.mjs

# Windows-specific restore commands
node restore-windows-vite.mjs # If you ran fix-windows-vite.mjs
node restore-windows-port.mjs # If you ran fix-windows-port.mjs
node restore-windows.mjs # If you ran fix-windows.mjs
```

## Database Operations

- Push schema changes to the database:
  ```bash
  npm run db:push
  ```

- Seed the database with sample data:
  ```bash
  npm run db:seed
  ```

## Troubleshooting

If you encounter any module resolution or import issues, try:

1. Check if there are any path-related errors in the console
2. Run the appropriate fix scripts for your environment
3. Ensure your Node.js version is compatible (v16+)
4. Verify that all dependencies are installed correctly

For Windows-specific issues, refer to the Windows development guide.