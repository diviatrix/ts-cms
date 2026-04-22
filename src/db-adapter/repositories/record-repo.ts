import adapter from '../sqlite-adapter.ts';
import IRecord from '../../types/IRecord.ts';
import IResolve from '../../types/IResolve.ts';
import { PaginationParams, PaginatedResponse } from '../../types/IPagination.ts';
import prep from '../../utils/prepare.ts';

export class RecordRepository {
    private db: adapter;

    constructor(db: adapter) {
        this.db = db;
    }

    public async createRecord(record: IRecord): Promise<IResolve<IRecord>> {
        const columns = ['id', 'title', 'description', 'content', 'image_url', 'user_id', 'tags', 'categories', 'is_published', 'created_at', 'updated_at'].join(', ');
        const placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'].join(', ');
        const values = [
            record.id,
            record.title,
            record.description,
            record.content,
            record.image_url || null,
            record.user_id,
            JSON.stringify(record.tags),
            JSON.stringify(record.categories),
            record.is_published ? 1 : 0,
            record.created_at.toISOString(),
            record.updated_at.toISOString(),
        ];
        const query = `INSERT INTO records (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, record);
    }

    public async getRecordById(id: string, publishedOnly: boolean = false): Promise<IResolve<IRecord | undefined>> {
        let query = `SELECT * FROM records WHERE id = ?`;
        const params = [id];
        if (publishedOnly) {
            query += ` AND is_published = 1`;
        }
        const response = await this.db.executeQuery(query, params);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IRecord) : undefined;
        if (data) {
            data.tags = JSON.parse(data.tags as unknown as string);
            data.categories = JSON.parse(data.categories as unknown as string);
            data.is_published = Boolean(data.is_published);
            data.created_at = new Date(data.created_at);
            data.updated_at = new Date(data.updated_at);
        }
        return prep.response(response.success, response.message, data);
    }

    public async updateRecord(id: string, updates: Partial<IRecord>): Promise<IResolve<IRecord | undefined>> {
        const fieldsToUpdate = Object.keys(updates).filter(key => updates[key as keyof IRecord] !== undefined);

        if (fieldsToUpdate.length === 0) {
            return prep.response(true, 'No fields to update', undefined);
        }

        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => {
            const value = updates[field as keyof IRecord];
            if (field === 'tags' || field === 'categories') return JSON.stringify(value);
            if (field === 'is_published') return value ? 1 : 0;
            if (field === 'created_at' || field === 'updated_at') return (value as Date).toISOString();
            if (value === null || value === undefined) return null;
            if (typeof value === 'boolean') return value ? 1 : 0;
            return value;
        });
        values.push(id);

        const query = `UPDATE records SET ${setClauses} WHERE id = ?`;
        const response = await this.db.executeQuery(query, values as (string | number | boolean | null)[]);
        return prep.response(response.success, response.message, undefined);
    }

    public async deleteRecord(id: string): Promise<IResolve<boolean>> {
        const query = `DELETE FROM records WHERE id = ?`;
        const response = await this.db.executeQuery(query, [id]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getAllRecords(
        publishedOnly: boolean = false,
        paginationParams?: PaginationParams
    ): Promise<IResolve<(IRecord & { public_name: string })[] | PaginatedResponse<IRecord & { public_name: string }> | undefined>> {
        if (!paginationParams) {
            return await this.getAllRecordsLegacy(publishedOnly);
        }

        const { page, size, categories, tags, search } = paginationParams;
        const offset = (page - 1) * size;

        const whereConditions = [];
        const params: (string | number)[] = [];
        
        if (publishedOnly) {
            whereConditions.push('r.is_published = 1');
        }
        
        if (categories && categories.length > 0) {
            const categoryConditions = categories.map(() => 'r.categories LIKE ?').join(' OR ');
            whereConditions.push(`(${categoryConditions})`);
            categories.forEach(cat => params.push(`%"${cat}"%`));
        }
        
        if (tags && tags.length > 0) {
            const tagConditions = tags.map(() => 'r.tags LIKE ?').join(' OR ');
            whereConditions.push(`(${tagConditions})`);
            tags.forEach(tag => params.push(`%"${tag}"%`));
        }
        
        if (search && search.trim()) {
            whereConditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.content LIKE ?)');
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(*) as total
            FROM records r
            LEFT JOIN user_profiles up ON r.user_id = up.user_id
            ${whereClause}
        `;
        
        const countResult = await this.db.executeQuery(countQuery, params);
        const total = (countResult.data?.[0] as { total: number })?.total || 0;

        const dataQuery = `
            SELECT
                r.id, r.title, r.description, r.content, r.image_url, r.user_id,
                r.tags, r.categories, r.is_published, r.created_at, r.updated_at,
                COALESCE(up.public_name, 'Admin') as public_name
            FROM records r
            LEFT JOIN user_profiles up ON r.user_id = up.user_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, size, offset];
        const dataResult = await this.db.executeQuery(dataQuery, dataParams);

        if (!dataResult.success) {
            return prep.response(false, dataResult.message, undefined);
        }

        const records = Array.isArray(dataResult.data) ? dataResult.data as unknown as (IRecord & { public_name: string })[] : [];
        
        records.forEach(record => {
            record.tags = JSON.parse(record.tags as unknown as string);
            record.categories = JSON.parse(record.categories as unknown as string);
            record.is_published = Boolean(record.is_published);
            record.created_at = new Date(record.created_at);
            record.updated_at = new Date(record.updated_at);
        });

        const totalPages = Math.ceil(total / size);
        
        const paginatedResponse: PaginatedResponse<IRecord & { public_name: string }> = {
            data: records,
            pagination: {
                page,
                size,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        return prep.response(true, 'Records retrieved successfully', paginatedResponse);
    }

    private async getAllRecordsLegacy(publishedOnly: boolean = false): Promise<IResolve<(IRecord & { public_name: string })[] | undefined>> {
        let query = `
            SELECT
                r.id, r.title, r.description, r.content, r.image_url, r.user_id,
                r.tags, r.categories, r.is_published, r.created_at, r.updated_at,
                COALESCE(up.public_name, 'Admin') as public_name
            FROM records r
            LEFT JOIN user_profiles up ON r.user_id = up.user_id
        `;
        const params: (string | number)[] = [];
        if (publishedOnly) {
            query += ` WHERE r.is_published = 1`;
        }
        query += ` ORDER BY r.created_at DESC`;
        
        const response = await this.db.executeQuery(query, params);
        const data = Array.isArray(response.data) ? (response.data as unknown as (IRecord & { public_name: string })[]) : undefined;
        if (data) {
            data.forEach(record => {
                record.tags = JSON.parse(record.tags as unknown as string);
                record.categories = JSON.parse(record.categories as unknown as string);
                record.is_published = Boolean(record.is_published);
                record.created_at = new Date(record.created_at);
                record.updated_at = new Date(record.updated_at);
            });
        }
        return prep.response(response.success, response.message, data);
    }

    public async query(query: string, params: (string | number | boolean | null)[] = []): Promise<IResolve<unknown[]>> {
        return await this.db.executeQuery(query, params);
    }
}