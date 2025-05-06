# Local Development Instructions

The project is configured to work optimally in the Replit environment, but you can run it locally by following these steps:

## Setup for Local Development

1. First, run the configuration fix script:

```bash
node fix-local-dev.js
```

This will modify the vite.config.ts file to be compatible with your local environment by replacing `import.meta.dirname` with `__dirname`.

2. Start the server:

```bash
npm run dev
```

3. When you're done with local development and want to restore the original Replit configuration:

```bash
node restore-config.js
```

## Recommended package.json Scripts for Local Development

If you want to make these commands easier to run, you can manually add these scripts to your local package.json:

```json
"scripts": {
  "dev:local": "node fix-local-dev.js && tsx server/index.ts",
  "dev:restore": "node restore-config.js"
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