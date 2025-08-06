import express, { Request, Response } from 'express';
import { requireAuth, optionalAuth, requireAuthAndAdmin } from '../middleware/auth.middleware';
import { UserRoles } from '../data/groups';
import { createRecord, getRecordById, updateRecord, deleteRecord } from '../functions/record';
import { getAllRecords } from '../functions/records';
import { ResponseUtils } from '../utils/response.utils';
import { validateBody, validateParams, ValidationSchemas, ParameterSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Content management endpoints
 */

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Markdown content
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_published:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Record created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all records
 *     tags: [Records]
 *     description: Returns published records for non-admin users, all records for admins
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     responses:
 *       200:
 *         description: Records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Record'
 */

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a specific record by ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record retrieved successfully
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update an existing record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 */

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete a record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
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

router.get('/records', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAuthenticatedUserAdmin = req.user && req.user.roles.includes('admin');
        // For unauthenticated users or non-admin users, only return published records
        const publishedOnly = !isAuthenticatedUserAdmin;
        const records = await getAllRecords(publishedOnly);
        ResponseUtils.success(res, records, 'Records retrieved successfully');
    } catch (error) {
        console.error("Failed to fetch all records:", error);
        ResponseUtils.internalError(res, 'Failed to fetch all records');
    }
});

// Get all unique tags and categories
router.get('/records/meta/tags-categories', optionalAuth, async (req: Request, res: Response) => {
    try {
        const isAuthenticatedUserAdmin = req.user && req.user.roles.includes('admin');
        const publishedOnly = !isAuthenticatedUserAdmin;
        const records = await getAllRecords(publishedOnly);
        
        const categoryCounts: { [key: string]: number } = {};
        const tagCounts: { [key: string]: number } = {};
        
        records.forEach(record => {
            if (record.categories) {
                record.categories.forEach(cat => {
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
            }
            if (record.tags) {
                record.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        const categories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
            
        const tags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
        
        ResponseUtils.success(res, { categories, tags }, 'Tags and categories retrieved successfully');
    } catch (error) {
        console.error("Failed to fetch tags and categories:", error);
        ResponseUtils.internalError(res, 'Failed to fetch tags and categories');
    }
});

export default router;
