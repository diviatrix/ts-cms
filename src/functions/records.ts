import IRecord from '../types/IRecord';
import { PaginationParams, PaginatedResponse } from '../types/IPagination';
import database from '../db';

export async function getAllRecords(
    publishedOnly: boolean = false,
    paginationParams?: PaginationParams
): Promise<IRecord[] | PaginatedResponse<IRecord & { public_name: string }>> {
    try {
        const dbRecordsResult = await database.getAllRecords(publishedOnly, paginationParams);
        if (!dbRecordsResult.success || !dbRecordsResult.data) {
            return paginationParams ?
                { data: [], pagination: { page: 1, size: 0, total: 0, totalPages: 0, hasNext: false, hasPrev: false } } :
                [];
        }
        return dbRecordsResult.data;
    } catch (error) {
        console.error('Error getting records:', error);
        throw error;
    }
}
