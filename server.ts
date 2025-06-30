import createExpressApp from "./src/expressapi.ts";
import config from './src/data/config';
import logger from './src/utils/logger';

// Add global error handlers
process.on('uncaughtException', (err) => {
    global.console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
    global.console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1); // Exit with a failure code
});

// Create the Express app
const app = createExpressApp();

// Start the server and keep it alive
const server = app.listen(config.api_port, () => {
    logger.info(`Server running at ${config.api_address}:${config.api_port}`, {
        environment: config.environment,
        cors_origin: config.origin,
        static_folder: config.static_folder
    });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});