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
import { getUser, getUserProfile, setPassword } from './functions/user';
import { RoleCheck } from './functions/roleCheck';
import { UserRoles } from './data/groups';
import { createRecord, getRecordById, updateRecord, deleteRecord } from './functions/record';
import { getAllRecords } from './functions/records';

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
                    token: result.data?.token // Include the token in the response
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
            //console.log('Request object:', req); // Debug log for entire request object
            console.log('Request user object:', (req as any).user); // Debug log for user object 

            const userId = (req as any).user.id; // Get the user ID from the authenticated token
            const profile = await getUserProfile(userId);

            res.status(200).json(profile); // Return the user profile
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch user profile.' });
        }
    });

    // Add the profile update endpoint
    app.post('/api/profile', authenticateToken, async (req: Request, res: Response) => {
        console.log('POST /api/profile endpoint reached'); // Debug log
        const authenticatedUserId = (req as any).user.id;
        const isAuthenticatedUserAdmin = (req as any).user.roles && RoleCheck.hasRole((req as any).user.roles, UserRoles.ADMIN);

        let targetUserId = authenticatedUserId;
        if (isAuthenticatedUserAdmin && req.body.user_id) {
            targetUserId = req.body.user_id;
        }

        const profileData = req.body.profile || {}; // Get the updated profile data from the request body, default to empty object
        const baseData = req.body.base || {}; // Get the updated base user data, default to empty object

        try {
            console.log('Received profile update data:', profileData); // Log received data
            console.log('Received base user data:', baseData); // Log received data

            // Update user profile
            await database.updateUserProfile(targetUserId, profileData);

            // Update base user data (only for admins)
            if (isAuthenticatedUserAdmin) {
                await database.updateUser(targetUserId, baseData);
                res.status(200).json({ success: true, message: 'User profile and base data updated successfully.' });
            } else {
                res.status(200).json({ success: true, message: 'User profile updated successfully.' });
            }
        } catch (error) {
            console.error("Failed to update user profile:", error);
            res.status(500).json({ status: 'error', message: 'Failed to update user profile.' });
        }
    });

    // Add the endpoint for admin profile updates
    // Add the endpoint to set user password
    app.post('/api/profile/password/set', authenticateToken, async (req: Request, res: Response) => {
        const { userId, newPassword } = req.body; // userId is optional, newPassword is required
        const authenticatedUserId = (req as any).user.id;
        const isAuthenticatedUserAdmin = (req as any).user.roles && RoleCheck.hasRole((req as any).user.roles, UserRoles.ADMIN);

        try {
            let targetUserId = userId;

            // If userId is not provided, or if the authenticated user is not an admin,
            // they can only change their own password.
            if (!targetUserId || !isAuthenticatedUserAdmin) {
                targetUserId = authenticatedUserId;
            }

            // If an admin tries to change a password for a user that doesn't exist
            if (isAuthenticatedUserAdmin && userId && targetUserId !== userId) {
                res.status(400).json({ success: false, message: 'Invalid target user ID for admin password change.' });
                return;
            }

            // Call a function to handle password update (will be implemented in user.ts)
            const result = await setPassword(targetUserId, newPassword);

            if (result.success) {
                res.status(200).json({ success: true, message: 'Password updated successfully.' });
            } else {
                res.status(400).json({ success: false, message: result.message });
            }
        } catch (error) {
            console.error("Failed to set user password:", error);
            res.status(500).json({ success: false, message: 'Failed to set user password.' });
        }
    });


    // Add the endpoint to get all users (for admin)
    app.get('/api/admin/users', authenticateToken, RoleCheck.adminAuth, async (req: Request, res: Response) => {
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

    app.get('/api/profile/:id', authenticateToken, RoleCheck.adminAuth, async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            const user = await getUser(userId);
            res.status(200).json(user);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch user profile.' });
        }
    });

    // Record API Endpoints
    app.post('/api/records', authenticateToken, RoleCheck.adminAuth, async (req: Request, res: Response) => {
        try {
            const newRecord = await createRecord(req.body, (req as any).user.id);
            res.status(201).json(newRecord);
        } catch (error) {
            console.error("Failed to create record:", error);
            res.status(500).json({ status: 'error', message: 'Failed to create record.' });
        }
    });

    app.get('/api/records/:id', async (req: Request, res: Response) => {
        try {
            const isAuthenticatedUserAdmin = (req as any).user && RoleCheck.hasRole((req as any).user.roles, UserRoles.ADMIN);
            const record = await getRecordById(req.params.id, !isAuthenticatedUserAdmin);
            if (record) {
                res.status(200).json(record);
            } else {
                res.status(404).json({ status: 'error', message: 'Record not found or not published.' });
            }
        } catch (error) {
            console.error("Failed to fetch record:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch record.' });
        }
    });

    app.put('/api/records/:id', authenticateToken, RoleCheck.adminAuth, async (req: Request, res: Response) => {
        try {
            const updatedRecord = await updateRecord(req.params.id, req.body);
            if (updatedRecord) {
                res.status(200).json(updatedRecord);
            } else {
                res.status(404).json({ status: 'error', message: 'Record not found.' });
            }
        } catch (error) {
            console.error("Failed to update record:", error);
            res.status(500).json({ status: 'error', message: 'Failed to update record.' });
        }
    });

    app.delete('/api/records/:id', authenticateToken, RoleCheck.adminAuth, async (req: Request, res: Response) => {
        try {
            const success = await deleteRecord(req.params.id);
            if (success) {
                res.status(204).send(); // No Content
            } else {
                res.status(404).json({ status: 'error', message: 'Record not found.' });
            }
        } catch (error) {
            console.error("Failed to delete record:", error);
            res.status(500).json({ status: 'error', message: 'Failed to delete record.' });
        }
    });

    app.get('/api/records', authenticateToken, async (req: Request, res: Response) => {
        try {
            const isAuthenticatedUserAdmin = (req as any).user && RoleCheck.hasRole((req as any).user.roles, UserRoles.ADMIN);
            const records = await getAllRecords(!isAuthenticatedUserAdmin);
            res.status(200).json(records);
        } catch (error) {
            console.error("Failed to fetch all records:", error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch all records.' });
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