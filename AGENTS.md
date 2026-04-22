# ts-cms - Agent Instructions

## Key Commands
- `npm run dev` - Dev server (port 7331)
- `npm run lint` - ESLint
- `npm test` - Tests with Allure reporter

## Project Structure
- `src/` - Backend routes, functions, middleware, types, db-adapter
- `public/` - Frontend SPA (vanilla JS)
- `data/` - SQLite database
- Entry: `server.ts`

## Notes
- First registered user becomes admin automatically
- Run `npx ts-node server.ts --checkdb --fix` to verify/create database tables