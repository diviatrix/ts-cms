import express, { Request, Response, NextFunction } from 'express';
import config from './data/config';
import messages from './data/messages';
import cors from 'cors';
import path from 'path';
import database from './db';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import adminRoutes from './routes/admin.routes';
import recordRoutes from './routes/record.routes';
import themeRoutes from './routes/theme.routes';
import { updateProfile } from './functions/updateProfile';
import { errorHandler } from './middleware/error.middleware';
import logger from './utils/logger';
import { ContextLogger } from './utils/context-logger';

function createExpressApp(): express.Application {
    // Create an Express application
    const app = express();  

    // Use CORS middleware to allow requests from the specified origin
    app.use(cors({ origin: config.origin }));   

    // Parse JSON request bodies FIRST - before any other middleware that needs req.body
    app.use(express.json());

    // Log all incoming requests to the API router
    app.use('/api', (req, res, next) => {
        const startTime = Date.now();
        
        // Log request
        logger.apiRequest(req.method, req.url);
        
        // Only log body for registration to debug the issue
        if (req.url === '/register' && req.method === 'POST') {
            console.log(`📝 Registration data received:`, req.body);
        }
        
        // Capture response
        const originalSend = res.send;
        res.send = function(body) {
            const timing = Date.now() - startTime;
            ContextLogger.api(req.method, req.url, res.statusCode, timing);
            return originalSend.call(this, body);
        };
        
        next();
    });

    // Serve static files from the specified folder
    app.use(express.static(path.join(__dirname, '..', config.static_folder)));

    // Define a simple API endpoint
    app.get('/api', (req: Request, res: Response) => {
      res.json({ status: messages.ok });
    });
    
    // Use auth routes
    app.use('/api', authRoutes);
    
    // Use profile routes
    app.use('/api', profileRoutes);
    
    // Use admin routes
    app.use('/api', adminRoutes);
    
    // Use record routes
    app.use('/api', recordRoutes);
    
    // Use theme routes
    app.use('/api/themes', themeRoutes);

    // Centralized error handling middleware (must be last)
    app.use(errorHandler);

    return app;
}

// Export the function to create the app
export { createExpressApp };

// Create and export the app instance for testing
const app = createExpressApp();
export default app;