import app from "./src/expressapi.ts";
import db from './src/db';
import console from './src/console';

// Add global error handlers
process.on('uncaughtException', (err) => {
    global.console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
    global.console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1); // Exit with a failure code
});
const expressApp = app();
const database = db;
const consoleApp = new console();