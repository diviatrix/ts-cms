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

function createExpressApp(): express.Application {
    // Create an Express application
    const app = express();  

    // Log all incoming requests to the API router
    app.use('/api', (req, res, next) => {
        logger.apiRequest(req.method, req.url);
        next();
    });

    // Use CORS middleware to allow requests from the specified origin
    app.use(cors({ origin: config.origin }));   

    // Parse JSON request bodies
    app.use(express.json());

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

// Create and export the app instance
const app = createExpressApp();

export default app;