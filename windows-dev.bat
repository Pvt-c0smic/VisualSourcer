@echo off
echo Setting up Windows development environment...

:: Apply ESM compatibility fixes
echo Applying ESM compatibility fixes...
node fix-windows.mjs
node fix-windows-port.mjs
node fix-local-dev.mjs

:: Set database connection string
echo Setting DATABASE_URL environment variable...
set DATABASE_URL=postgresql://postgres:postgres@localhost:2002/lms_database

:: Run the application
echo Starting application...
npm run dev