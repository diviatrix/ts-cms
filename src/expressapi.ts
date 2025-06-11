import express, { Request, Response } from 'express';
import config from './data/config';
import messages from './data/messages';
import cors from 'cors';
import path from 'path';
import { registerUser } from './functions/register';
import { loginUser } from './functions/login';
import database from './db';
import { updateProfile } from './functions/updateProfile';
import { authenticateToken } from './utils/jwt';

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

        try {
            const result = await registerUser(userData);
            res.status(201).json(result); // Respond with success status and result
        } catch (error) {
            console.error("Registration failed:", error);
            if (error && typeof error === 'object' && 'success' in error && error.success === false) {
                res.status(400).json({ status: 'error', message: (error as unknown as { message: string }).message });
            } else {
                res.status(500).json({ status: 'error', message: 'An unexpected error occurred during registration.' });
            }
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
                    token: result.token // Include the token in the response
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

    // Start the server on the specified port and address
    app.listen(config.api_port, () => {
      console.log(messages.server_running + config.api_address + ':' + config.api_port);
    });
    return app;
}