import IRecord from '../types/IRecord';
import database from '../db';

export async function getAllRecords(publishedOnly: boolean = false): Promise<IRecord[]> {
    try {
        const dbRecordsResult = await database.getAllRecords(publishedOnly);
        if (!dbRecordsResult.success || !dbRecordsResult.data) {
            return [];
        }
        return dbRecordsResult.data;
    } catch (error) {
        console.error('Error getting all records:', error);
        throw error;
    }
}
