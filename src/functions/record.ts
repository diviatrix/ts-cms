import IRecord from '../types/IRecord';
import { v4 as uuidv4 } from 'uuid';
import database from '../db';

export async function createRecord(record: Omit<IRecord, 'id' | 'createdAt' | 'updatedAt' | 'user_id'>, userId: string): Promise<IRecord | undefined> {
    const id = uuidv4();
    const now = new Date();

    const newRecord: IRecord = {
        ...record,
        id,
        user_id: userId,
        created_at: now,
        updated_at: now,
    };

    try {
        const result = await database.createRecord(newRecord);
        if (result.success) {
            return result.data;
        } else {
            console.error('Failed to create record in DB:', result.message);
            return undefined;
        }
    } catch (error) {
        console.error('Error creating record:', error);
        return undefined;
    }
}

export async function getRecordById(id: string, publishedOnly: boolean = false): Promise<IRecord | undefined> {
    try {
        const dbRecordResult = await database.getRecordById(id, publishedOnly);
        if (!dbRecordResult.success || dbRecordResult.data === undefined) {
            return undefined;
        }
        const record: IRecord = dbRecordResult.data;
        return record;
    } catch (error) {
        console.error(`Error reading record ${id}:`, error);
        throw error;
    }
}

export async function updateRecord(id: string, updates: Partial<Omit<IRecord, 'id' | 'createdAt'>>): Promise<IRecord | undefined> {
    try {
        const dbUpdateResult = await database.updateRecord(id, { ...updates, updated_at: new Date() });

        if (dbUpdateResult.success && dbUpdateResult.data) {
            return dbUpdateResult.data;
        } else if (dbUpdateResult.success) {
            return getRecordById(id);
        }
        return undefined;
    } catch (error) {
        console.error(`Error updating record ${id}:`, error);
        return undefined;
    }
}

export async function deleteRecord(id: string): Promise<boolean> {
    try {
        const dbDeleteResult = await database.deleteRecord(id);
        return dbDeleteResult.success;
    } catch (error) {
        console.error(`Error deleting record ${id}:`, error);
        return false;
    }
}
