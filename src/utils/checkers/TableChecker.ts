/**
 * Table Checker
 * Responsible for verifying and creating database tables
 *
 * @module utils/checkers/TableChecker
 */

import adapter from '../../db-adapter/sqlite-adapter';
import IResolve from '../../types/IResolve';
import prep from '../../utils/prepare';
import { SchemaParser } from '../schema-parser';

/**
 * TableChecker handles table existence validation and creation
 */
export class TableChecker {
    private db: adapter;
    private schemaParser: SchemaParser;

    constructor(db: adapter, schemaParser: SchemaParser) {
        this.db = db;
        this.schemaParser = schemaParser;
    }

    /**
     * Check which required tables are missing from the database
     *
     * @returns Promise resolving to list of missing table names
     */
    public async checkTables(): Promise<IResolve<string[]>> {
        try {
            const tablesResult = await this.db.getTables();

            if (!tablesResult.success || !Array.isArray(tablesResult.data)) {
                return prep.response(false, 'Failed to get table list from database', []);
            }

            const existingTables = tablesResult.data as string[];
            const requiredTables = this.schemaParser.getRequiredTables();
            const missingTables = requiredTables.filter(table => !existingTables.includes(table));

            return prep.response(true, 'Tables checked successfully', missingTables);
        } catch (error) {
            return prep.response(false, `Error checking tables: ${error}`, []);
        }
    }

    /**
     * Create missing tables in the database
     *
     * @param tables - Array of table names to create
     * @returns Promise resolving to void on success
     */
    public async createMissingTables(tables: string[]): Promise<IResolve<void>> {
        try {
            // Use the adapter's existing createTables method
            const result = await this.db.createTables(tables);
            if (result.success) {
                return prep.response(true, `Successfully created tables: ${tables.join(', ')}`);
            } else {
                return prep.response(false, `Failed to create tables: ${result.message}`);
            }
        } catch (error) {
            return prep.response(false, `Error creating tables: ${error}`);
        }
    }
}