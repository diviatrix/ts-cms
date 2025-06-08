import express, { Request, Response } from 'express';
import config from './data/config';
import messages from './data/messages';
import cors from 'cors';
import path from 'path';
import { registerUser } from './functions/register';
import { loginUser } from './functions/login';

export default function createExpressApp() {
    // Create an Express application
    const app = express();  

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
                res.status(200).json(result); // Respond with success status and result
            } else {
                res.status(401).json(result); // Respond with unauthorized status and result on failure
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            res.status(500).json({ status: 'error', message: error.message || 'Login failed' });
        }
    });
    // Start the server on the specified port and address
    app.listen(config.api_port, () => {
      console.log(messages.server_running + config.api_address + ':' + config.api_port);
    });
    return app;
}