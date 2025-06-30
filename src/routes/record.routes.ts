import express, { Request, Response } from 'express';
import { requireAuth, optionalAuth, requireAuthAndAdmin } from '../middleware/auth.middleware';
import { UserRoles } from '../data/groups';
import { createRecord, getRecordById, updateRecord, deleteRecord } from '../functions/record';
import { getAllRecords } from '../functions/records';
import { ResponseUtils } from '../utils/response.utils';
import { validateBody, validateParams, ValidationSchemas, ParameterSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';

const router = express.Router();

// Record API Endpoints
router.post('/records', requireAuthAndAdmin, validateBody(ValidationSchemas.record), asyncHandler(async (req: Request, res: Response) => {
    const newRecord = await createRecord(req.body, req.user!.id);
    ResponseUtils.created(res, newRecord, 'Record created successfully');
}));

router.get('/records/:id', optionalAuth, validateParams(ParameterSchemas.uuid), asyncHandler(async (req: Request, res: Response) => {
    const isAuthenticatedUserAdmin = req.user && req.user.roles.includes('admin');
    const record = await getRecordById(req.params.id, !isAuthenticatedUserAdmin);
    if (record) {
        ResponseUtils.success(res, record, 'Record retrieved successfully');
    } else {
        throw Errors.notFound('Record not found or not published');
    }
}));

router.put('/records/:id', requireAuthAndAdmin, validateParams(ParameterSchemas.uuid), validateBody(ValidationSchemas.record), async (req: Request, res: Response) => {
    try {
        const updatedRecord = await updateRecord(req.params.id, req.body);
        if (updatedRecord) {
            ResponseUtils.success(res, updatedRecord, 'Record updated successfully');
        } else {
            ResponseUtils.notFound(res, 'Record not found');
        }
    } catch (error) {
        console.error("Failed to update record:", error);
        ResponseUtils.internalError(res, 'Failed to update record');
    }
});

router.delete('/records/:id', requireAuthAndAdmin, validateParams(ParameterSchemas.uuid), async (req: Request, res: Response) => {
    try {
        const success = await deleteRecord(req.params.id);
        if (success) {
            ResponseUtils.noContent(res);
        } else {
            ResponseUtils.notFound(res, 'Record not found');
        }
    } catch (error) {
        console.error("Failed to delete record:", error);
        ResponseUtils.internalError(res, 'Failed to delete record');
    }
});

router.get('/records', requireAuth, async (req: Request, res: Response) => {
    try {
        const isAuthenticatedUserAdmin = req.user && req.user.roles.includes('admin');
        const records = await getAllRecords(!isAuthenticatedUserAdmin);
        ResponseUtils.success(res, records, 'Records retrieved successfully');
    } catch (error) {
        console.error("Failed to fetch all records:", error);
        ResponseUtils.internalError(res, 'Failed to fetch all records');
    }
});

export default router;
