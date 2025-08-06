import { createExpressApp } from "./src/expressapi";
import config from './src/data/config';
import logger from './src/utils/logger';
import { DatabaseChecker } from './src/utils/database-checker';

// Add global error handlers
process.on('uncaughtException', (err) => {
    global.console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
    global.console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1); // Exit with a failure code
});

// Check for CLI commands
const args = process.argv.slice(2);

async function handleCLICommands() {
    // Handle --checkdb command
    if (args.includes('--checkdb')) {
        // Check if --fix flag is present
        const autoFix = args.includes('--fix');
        
        try {
            const checker = new DatabaseChecker();
            const result = await checker.checkDatabase(autoFix);
            
            if (result.success) {
                // Simple one-line output for success
                console.log('✓ Database check passed - all tables and columns exist');
            } else {
                // Detailed output only for failures
                console.log('\n=== Database Consistency Check FAILED ===');
                
                if (result.data) {
                    if (result.data.missingTables.length > 0) {
                        console.log('\n❌ Missing Tables:');
                        result.data.missingTables.forEach(table => {
                            console.log(`   • ${table}`);
                        });
                    }
                    
                    if (result.data.missingColumns.length > 0) {
                        console.log('\n❌ Missing Columns:');
                        result.data.missingColumns.forEach(mc => {
                            console.log(`   • ${mc.table}.${mc.column}`);
                        });
                    }
                    
                    if (!autoFix) {
                        console.log('\n💡 Tip: Use --checkdb --fix to automatically create missing items');
                    }
                }
                
                console.log('\n' + result.message);
                console.log('=========================================\n');
            }
            
            // Exit with appropriate status code
            process.exit(result.success ? 0 : 1);
            
        } catch (error) {
            console.error('❌ Database check failed with error:', error);
            process.exit(1);
        }
    }
    
    // If no CLI command was handled, return false to continue with normal server startup
    return false;
}

async function startApplication() {
    // Handle CLI commands first
    await handleCLICommands();
    
    // If we reach here, no CLI command was processed, so start the normal server
    startServer();
}

function startServer() {
    // Create the Express app
    const app = createExpressApp();

    // Start the server and keep it alive
    const server = app.listen(config.api_port, () => {
        logger.info(`Server running at ${config.api_address}:${config.api_port}`, {
            environment: config.environment,
            cors_origin: config.origin,
            static_folder: config.static_folder
        });
        
        console.log('\n=== TypeScript CMS Server Started ===');
        console.log(`🚀 Server is running at ${config.api_address}:${config.api_port}`);
        console.log('📁 Static files served from:', config.static_folder);
        console.log('🔗 CORS origin:', config.origin);
        console.log('\nPress Ctrl+C to stop the server');
        console.log('=====================================\n');
    });

    // Keep server alive - prevent auto-exit
    process.stdin.resume();

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
}

// Start the application
startApplication();