# Local Development Instructions

The project is configured to work optimally in the Replit environment, but you can run it locally by following these steps:

## Setup for Local Development

1. First, run the configuration fix script:

```bash
node fix-local-dev.js
```

This will modify the vite.config.ts file to be compatible with your local environment by replacing `import.meta.dirname` with `__dirname`.

> **Important**: Due to the project using ES Modules (type: "module" in package.json), you'll need to use the `.mjs` extension for the scripts to identify them as ES modules.

```bash
# Rename the scripts to use .mjs extension
mv fix-local-dev.js fix-local-dev.mjs
mv restore-config.js restore-config.mjs

# Run with node
node fix-local-dev.mjs
```

2. Start the server:

```bash
npm run dev
```

3. When you're done with local development and want to restore the original Replit configuration:

```bash
node restore-config.mjs
```

## Recommended package.json Scripts for Local Development

If you want to make these commands easier to run, you can manually add these scripts to your local package.json:

```json
"scripts": {
  "dev:local": "node fix-local-dev.mjs && tsx server/index.ts",
  "dev:restore": "node restore-config.mjs"
}
```

Then you can simply run:

```bash
npm run dev:local
```

And to restore:

```bash
npm run dev:restore
```

## OpenAI Integration

The application has been configured to work with or without an OpenAI API key:

- With a valid API key: Full AI features will be available
- Without an API key: Fallback mechanisms will provide reasonable functionality

If you want to use the OpenAI features locally, set the OPENAI_API_KEY environment variable:

```bash
# On Windows
set OPENAI_API_KEY=your_api_key_here

# On macOS/Linux
export OPENAI_API_KEY=your_api_key_here
```

## Database Connection

For local development, make sure you have a PostgreSQL database running and set the DATABASE_URL environment variable accordingly.

```bash
# On Windows
set DATABASE_URL=postgresql://username:password@localhost:5432/databasename

# On macOS/Linux
export DATABASE_URL=postgresql://username:password@localhost:5432/databasename
```

## Additional Utilities for Local Development

When developing locally, you might find it helpful to install a few additional packages to make development smoother:

```bash
npm install --save-dev cross-env
```

Then you can add these scripts to your package.json:

```json
"scripts": {
  "dev:local:win": "cross-env NODE_ENV=development node fix-local-dev.mjs && tsx server/index.ts",
  "dev:local:unix": "NODE_ENV=development node fix-local-dev.mjs && tsx server/index.ts"
}
```

This will help with environment variable handling across different operating systems.