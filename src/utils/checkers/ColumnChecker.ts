/**
 * Column Checker
 * Responsible for verifying and adding columns to database tables
 *
 * @module utils/checkers/ColumnChecker
 */

import adapter from '../../db-adapter/sqlite-adapter';
import { SchemaParser } from '../schema-parser';
import IResolve from '../../types/IResolve';
import prep from '../../utils/prepare';

/**
 * MissingColumn represents a column that exists in schema but not in database
 */
export interface MissingColumn {
    table: string;
    column: string;
}

/**
 * ColumnChecker handles column existence validation and addition
 */
export class ColumnChecker {
    private db: adapter;
    private schemaParser: SchemaParser;

    constructor(db: adapter, schemaParser: SchemaParser) {
        this.db = db;
        this.schemaParser = schemaParser;
    }

    /**
     * Check for missing columns in all required tables
     *
     * @returns Promise resolving to array of missing column information
     */
    public async checkColumns(): Promise<IResolve<MissingColumn[]>> {
        const missingColumns: MissingColumn[] = [];
        const requiredTables = this.schemaParser.getRequiredTables();

        try {
            for (const tableName of requiredTables) {
                const tableColumnsResult = await this._getTableColumns(tableName);

                if (!tableColumnsResult.success || !tableColumnsResult.data) {
                    return prep.response(false, `Failed to get columns for table ${tableName}`, []);
                }

                const existingColumns = tableColumnsResult.data.map(col => col.name);
                const requiredColumns = this.schemaParser.parseTableSchema(tableName);

                for (const requiredColumn of requiredColumns) {
                    if (!existingColumns.includes(requiredColumn)) {
                        missingColumns.push({ table: tableName, column: requiredColumn });
                    }
                }
            }

            return prep.response(true, 'Columns checked successfully', missingColumns);
        } catch (error) {
            return prep.response(false, `Error checking columns: ${error}`, []);
        }
    }

    /**
     * Add missing columns to their respective tables
     *
     * @param missing - Array of missing column information
     * @returns Promise resolving to void on success
     */
    public async addMissingColumns(missing: MissingColumn[]): Promise<IResolve<void>> {
        try {
            for (const { table, column } of missing) {
                const columnDef = this.schemaParser.getColumnDefinition(table, column);
                if (!columnDef) {
                    console.error(`Could not find column definition for ${table}.${column}`);
                    continue;
                }

                const alterQuery = `ALTER TABLE ${table} ADD COLUMN ${columnDef}`;
                const result = await this.db.executeQuery(alterQuery, []);

                if (!result.success) {
                    console.error(`Failed to add column ${column} to ${table}: ${result.message}`);
                    return prep.response(false, `Failed to add column ${column} to ${table}`);
                }
            }

            return prep.response(true, 'Successfully added all missing columns');
        } catch (error) {
            return prep.response(false, `Error adding columns: ${error}`);
        }
    }

    /**
     * Get column information for a specific table using PRAGMA
     * @private
     */
    private async _getTableColumns(tableName: string): Promise<IResolve<{ name: string }[]>> {
        const query = `PRAGMA table_info('${tableName}')`;
        const result = await this.db.executeQuery(query, []);

        if (result.success && Array.isArray(result.data)) {
            const columns = result.data as { name: string }[];
            return prep.response(true, 'Columns retrieved successfully', columns);
        }

        return prep.response(false, `Failed to get columns for table ${tableName}`, []);
    }
}