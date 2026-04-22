/**
 * Schema Parser Utility
 * Parses CREATE TABLE SQL schemas to extract column information
 *
 * @module utils/schema-parser
 */

import schemas, { defaultCMSSettings } from '../db-adapter/sql-schemas';

/**
 * Interface representing a column definition extracted from schema
 */
export interface ColumnDefinition {
    name: string;
    fullDefinition: string;
}

/**
 * SchemaParser class for parsing SQL table schemas
 * Handles extraction of column names and definitions from CREATE TABLE statements
 */
export class SchemaParser {
    /**
     * Parse table schema to extract required column names
     * Handles composite primary keys, foreign keys, and various constraints
     *
     * @param tableName - Name of the table to parse
     * @returns Array of required column names for the table
     *
     * @example
     * const parser = new SchemaParser();
     * const columns = parser.parseTableSchema('users');
     * // Returns: ['id', 'login', 'password', 'email', ...]
     */
    public parseTableSchema(tableName: string): string[] {
        const schema = schemas[tableName as keyof typeof schemas];
        if (!schema) {
            return [];
        }

        // Extract column definitions from CREATE TABLE statement
        const createTableMatch = schema.match(/CREATE TABLE[^(]*\(([\s\S]*)\)/i);
        if (!createTableMatch) {
            return [];
        }

        const tableContent = createTableMatch[1];
        const columns: string[] = [];

        // Split into lines and process each column definition
        const lines = this._splitIntoLines(tableContent);

        for (const line of lines) {
            // Skip table-level constraints (FOREIGN KEY, PRIMARY KEY, CHECK, CONSTRAINT)
            if (this._isTableConstraint(line)) {
                continue;
            }

            // Extract column name from definition
            const columnName = this._extractColumnName(line);
            if (columnName) {
                columns.push(columnName);
            }
        }

        return columns;
    }

    /**
     * Get full column definition (type + constraints) from schema
     *
     * @param tableName - Name of the table
     * @param columnName - Name of the column to find
     * @returns Full column definition string or null if not found
     */
    public getColumnDefinition(tableName: string, columnName: string): string | null {
        const schema = schemas[tableName as keyof typeof schemas];
        if (!schema) {
            return null;
        }

        const createTableMatch = schema.match(/CREATE TABLE[^(]*\(([\s\S]*)\)/i);
        if (!createTableMatch) {
            return null;
        }

        const tableContent = createTableMatch[1];
        const lines = this._splitIntoLines(tableContent);

        for (const line of lines) {
            if (this._isTableConstraint(line)) {
                continue;
            }

            const trimmedLine = line.replace(/,$/, '').trim();
            const match = trimmedLine.match(/^(\w+)\s+(.+)$/);

            if (match && match[1] === columnName) {
                return trimmedLine;
            }
        }

        return null;
    }

    /**
     * Get all required tables from schemas
     *
     * @returns Array of table names defined in schemas
     */
    public getRequiredTables(): string[] {
        return Object.keys(schemas);
    }

    /**
     * Get default CMS settings
     *
     * @returns Array of default CMS setting definitions
     */
    public getDefaultCMSSettings(): typeof defaultCMSSettings {
        return defaultCMSSettings;
    }

    /**
     * Split table content into individual lines, preserving structure
     * @private
     */
    private _splitIntoLines(content: string): string[] {
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * Check if line represents a table-level constraint
     * @private
     */
    private _isTableConstraint(line: string): boolean {
        const trimmed = line.trim();
        return (
            trimmed === ',' ||
            trimmed.includes('FOREIGN KEY') ||
            trimmed.includes('PRIMARY KEY') ||
            trimmed.startsWith('CONSTRAINT') ||
            trimmed.includes('CHECK')
        );
    }

    /**
     * Extract column name from a column definition line
     * @private
     */
    private _extractColumnName(line: string): string | null {
        const trimmedLine = line.replace(/,$/, '').trim();
        const match = trimmedLine.match(/^(\w+)/);
        return match ? match[1] : null;
    }
}

/**
 * Create a default schema parser instance
 * @returns New SchemaParser instance
 */
export function createSchemaParser(): SchemaParser {
    return new SchemaParser();
}