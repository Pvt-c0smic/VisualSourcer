# Windows Development Instructions

These instructions are specifically tailored for running the application on Windows.

## Setup for Local Windows Development

1. First, run the Vite configuration fix script:

```bash
node fix-windows.mjs
```

This will modify the vite.config.ts file to be compatible with Windows environment.

2. Next, run the port fix script to avoid permission issues on Windows:

```bash
node fix-windows-port.mjs
```

This will modify the server to run on port 3000 instead of 5000 (which often requires admin privileges on Windows).

3. Start the server:

```bash
npm run dev
```

4. Access your application at: http://localhost:3000

## Database Setup

For local development, make sure you have a PostgreSQL database running and set the DATABASE_URL environment variable:

```bash
# On Windows Command Prompt
set DATABASE_URL=postgresql://username:password@localhost:5432/databasename

# On Windows PowerShell
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/databasename"
```

## OpenAI Integration

If you want to use the OpenAI features locally, set the OPENAI_API_KEY environment variable:

```bash
# On Windows Command Prompt
set OPENAI_API_KEY=your_api_key_here

# On Windows PowerShell
$env:OPENAI_API_KEY = "your_api_key_here"
```

## Restoring Original Configuration for Replit

When you're done with local development and want to push your changes back to Replit:

1. Restore the server configuration:

```bash
node restore-windows-port.mjs
```

2. Restore the Vite configuration:

```bash
node restore-windows.mjs
```

## Troubleshooting

If you encounter module resolution issues, make sure you're running Node.js v16+ and that your npm dependencies are installed:

```bash
npm install
```

For port conflicts, you can modify the port number in the `fix-windows-port.mjs` script to use a different port.