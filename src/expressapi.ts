import express, { Request, Response } from 'express';
import config from './data/config';
import messages from './data/messages';
import cors from 'cors';
import path from 'path';

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

    // Start the server on the specified port and address
    app.listen(config.api_port, () => {
      console.log(messages.server_running + config.api_address + ':' + config.api_port);
    });
    return app;
}