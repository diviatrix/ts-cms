import { Request, Response, NextFunction } from 'express';
import { getCMSSetting } from '../functions/cms-settings';
import { ResponseUtils } from '../utils/response.utils';

/**
 * Middleware to check if API documentation is enabled
 * Returns 404 if disabled to hide the existence of the endpoint
 */
export async function checkApiDocsEnabled(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const apiDocsSetting = await getCMSSetting('api_docs_enabled');
        const isEnabled = apiDocsSetting.success && apiDocsSetting.data 
            ? apiDocsSetting.data.setting_value === 'true' 
            : false;

        if (!isEnabled) {
            // Return 404 to hide the existence of the endpoint in production
            ResponseUtils.notFound(res, 'Resource not found');
            return;
        }

        next();
    } catch (error) {
        console.error('Error checking API docs setting:', error);
        // Default to disabled on error
        ResponseUtils.notFound(res, 'Resource not found');
    }
}