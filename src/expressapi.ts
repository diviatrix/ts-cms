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
import cmsRoutes from './routes/cms.routes';
import { updateProfile } from './functions/updateProfile';
import { errorHandler } from './middleware/error.middleware';
import { applyRateLimits } from './middleware/rate-limit.middleware';
import logger from './utils/logger';
import { ContextLogger } from './utils/context-logger';
import { securityHeaders } from './middleware/security-headers.middleware';
import { sanitizeInput } from './middleware/sanitization.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import { checkApiDocsEnabled } from './middleware/api-docs.middleware';

function createExpressApp(): express.Application {
    // Create an Express application
    const app = express();  

    // Use CORS middleware to allow requests from the specified origin
    app.use(cors({ origin: config.origin }));   

    // Parse JSON request bodies FIRST - before any other middleware that needs req.body
    app.use(express.json());

    // Apply minimal security headers to all responses
    app.use(securityHeaders);

    // Sanitize input for POST/PUT API requests only
    app.use('/api', (req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            return sanitizeInput(req, res, next);
        }
        next();
    });

    // Apply rate limiting to API routes
    applyRateLimits(app);

    // Swagger documentation - serve before other API routes
    // Protected by middleware to check if enabled in CMS settings
    app.use('/api-docs', 
        checkApiDocsEnabled,
        swaggerUi.serve, 
        swaggerUi.setup(swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'TypeScript CMS API Docs'
        })
    );

    // Log all incoming requests to the API router
    app.use('/api', (req, res, next) => {
        const startTime = Date.now();
        
        // Log request
        logger.apiRequest(req.method, req.url);
        

        
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
    
    // Serve node_modules for client-side libraries (highlight.js)
    app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));

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
    
    // Use CMS routes
    app.use('/api/cms', cmsRoutes);

    // Serve index.html for all non-API routes (SPA support)
    app.use((req: Request, res: Response, next: NextFunction) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        // Skip static files with extensions
        if (req.path.includes('.')) {
            return next();
        }
        
        // Serve index.html for SPA routes
        res.sendFile(path.join(__dirname, '..', config.static_folder, 'index.html'));
    });

    // Centralized error handling middleware (must be last)
    app.use(errorHandler);

    return app;
}

// Export the function to create the app
export { createExpressApp };

// Create and export the app instance for testing
const app = createExpressApp();
export default app;