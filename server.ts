import app from "./src/expressapi.ts";

// Add global error handlers
process.on('uncaughtException', (err) => {
    global.console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
    global.console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1); // Exit with a failure code
});
app();