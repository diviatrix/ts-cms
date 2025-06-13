import express, { Request, Response, NextFunction } from 'express';
import config from './data/config';
import messages from './data/messages';
import cors from 'cors';
import path from 'path';
import { registerUser } from './functions/register';
import { loginUser } from './functions/login';
import database from './db';
import { updateProfile } from './functions/updateProfile';
import { authenticateToken } from './utils/jwt';
import { getAllBaseUsers } from './functions/users';

export default function createExpressApp(): express.Application {
    // Create an Express application
    const app = express();  

    // Log all incoming requests to the API router
    app.use('/api', (req, res, next) => {
        console.log(`${req.method} ${req.url} incoming`);
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
    
    // Add the registration endpoint
    app.post('/api/register', async (req: Request, res: Response) => {
        const userData = req.body; // Assuming the user data is sent in the request body

        const result = await registerUser(userData);
        if (result) {
            res.status(201).json(result); // Respond with success status and result
        } else {
            res.status(400).json({ status: 'error', message: 'Registration failed.' }); // Respond with a 400 Bad Request
        }
    });

    // Add the login endpoint
    app.post('/api/login', async (req: Request, res: Response) => {
        const { login, password } = req.body; // Assuming login and password are sent in the request body

        try {
            const result = await loginUser(login, password);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    token: result.data.token // Include the token in the response
                }); // Respond with success status and result
            } else {
                res.status(401).json(result); // Respond with unauthorized status and result on failure
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            res.status(500).json({ status: 'error', message: error.message || 'Login failed' });
        }
    });

    // Add the profile endpoint
    app.get('/api/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
        console.log('Attempting to get userId from request'); // Debug log before getting userId
        try {
            console.log('Entering GET /api/profile try block'); // Debug log

            if (!(req as any).user || !(req as any).user.id) {
                console.error('Error: User object or user ID is missing from the request after authentication.');
                res.status(400).json({ status: 'error', message: 'User information not available.' });
            }

            console.log('Reached try block in GET /api/profile handler'); // Debug log
            console.log('Request object:', req); // Debug log for entire request object
            console.log('Request user object:', (req as any).user); // Debug log for user object 

            const userId = (req as any).user.id; // Get the user ID from the authenticated token
            let profile = await database.getUserProfile(userId);

            if (!profile) {
                console.log('No profile found, creating one for user:', userId); // Debug log before create
                await database.createUserProfile(userId);
                console.log('User profile created.'); // Debug log after create
                profile = await database.getUserProfile(userId); // Fetch the profile again after creation
            }

            console.log('Fetching profile for user ID:', userId); // Debug log before database call
            console.log('Database returned for user ID:', userId, ':', profile); // Debug log after database call

            res.status(200).json(profile); // Return the user profile
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch user profile.' });
        }
    });

    // Add the profile update endpoint
    app.post('/api/profile', authenticateToken, async (req: Request, res: Response) => {
        console.log('POST /api/profile endpoint reached'); // Debug log
        const user_id = (req as any).user.id; // Get the user ID from the authenticated token
        const profileData = req.body; // Get the updated profile data from the request body

        try {
            console.log('Received profile update data:', profileData); // Log received data

            await updateProfile(user_id, profileData);
            res.status(200).json({ success: true, message: 'User profile updated successfully.' });
        } catch (error) {
            console.error("Failed to update user profile:", error);
            res.status(500).json({ status: 'error', message: 'Failed to update user profile.' });
        }
    });

    // Add the endpoint for admin profile updates
    app.post('/api/admin/updateProfile', authenticateToken, async (req: Request, res: Response) => {
        console.log('POST /api/admin/updateProfile endpoint reached'); // Debug log
        // TODO: Add authorization check to ensure the user is an administrator

        const { userId, profileData } = req.body; // Get the target user ID and updated profile data
        console.log(`Admin attempting to update profile for userId: ${userId} with data:`, profileData); // Debug log

        try {
            // Call a database function to update the user's profile
            await database.adminUpdateUserProfile(userId, profileData); // We will implement this in db.ts
            console.log(`Profile updated successfully for userId: ${userId}`); // Debug log
            res.status(200).json({ success: true, message: 'User profile updated successfully.' });
        } catch (error) {
            console.error("Failed to update user profile as admin:", error);
            res.status(500).json({ status: 'error', message: 'Failed to update user profile.' });
        }
    });


    // Add the endpoint to get all users (for admin)
    app.get('/api/users', authenticateToken, async (req: Request, res: Response) => {
        console.log('GET /api/users endpoint reached'); // Debug log
        try {
             // Check if the authenticated user has admin role (you'll need to add this check)
            // For now, we'll just proceed, but this is a security vulnerability
            // if you don't restrict this endpoint to admins.

            console.log('Calling getAllUsers function...'); // Added log
            const users = await getAllBaseUsers(); // Fetch all users using the new function
            res.status(200).json(users); // Return the list of users
        } catch (error) {
            console.error("Failed to fetch users:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
        }
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error('Async error caught by middleware:', err);
        if (res.headersSent) {
            return next(err); // Let default error handler close the connection if headers already sent
        }
        res.status(500).json({ status: 'error', message: 'An unexpected asynchronous error occurred.' });
    });

    // Start the server on the specified port and address
    app.listen(config.api_port, () => {
      console.log(messages.server_running + config.api_address + ':' + config.api_port);
    });
    return app;
}