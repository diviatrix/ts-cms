import adapter from '../db-adapter/sqlite-adapter';
import schemas from '../db-adapter/sql-schemas';
import IResolve from '../types/IResolve';
import prep from './prepare';

interface TableSchema {
    name: string;
    type: string;
    notnull: number;
    pk: number;
}

interface DatabaseCheckResult {
    tablesOk: boolean;
    columnsOk: boolean;
    missingTables: string[];
    missingColumns: Array<{ table: string; column: string }>;
    message: string;
}

export class DatabaseChecker {
    private db: adapter;
    
    constructor() {
        this.db = new adapter();
    }


    /**
     * Check database consistency - tables and columns
     * @param autoFix - If true, automatically create missing tables and columns
     */
    public async checkDatabase(autoFix: boolean = false): Promise<IResolve<DatabaseCheckResult>> {
        try {
            const result: DatabaseCheckResult = {
                tablesOk: true,
                columnsOk: true,
                missingTables: [],
                missingColumns: [],
                message: ''
            };

            // Check tables (reuse existing logic)
            const tableCheck = await this.checkTables();
            if (!tableCheck.success || !tableCheck.data) {
                return prep.response(false, 'Failed to check database tables', result);
            }

            result.missingTables = tableCheck.data;
            result.tablesOk = result.missingTables.length === 0;

            // Auto-fix missing tables if requested
            if (!result.tablesOk && autoFix) {
                console.log(`Creating missing tables: ${result.missingTables.join(', ')}...`);
                
                const createResult = await this.createMissingTables(result.missingTables);
                if (createResult.success) {
                    // Re-check tables after creation
                    const recheck = await this.checkTables();
                    if (recheck.success && recheck.data) {
                        result.missingTables = recheck.data;
                        result.tablesOk = result.missingTables.length === 0;
                    }
                }
            }

            // Only check columns if all tables exist
            if (result.tablesOk) {
                const columnCheck = await this.checkColumns();
                if (!columnCheck.success || !columnCheck.data) {
                    return prep.response(false, 'Failed to check database columns', result);
                }

                result.missingColumns = columnCheck.data;
                result.columnsOk = result.missingColumns.length === 0;
                
                // Auto-fix missing columns if requested
                if (!result.columnsOk && autoFix) {
                    console.log(`Adding missing columns...`);
                    result.missingColumns.forEach(mc => {
                        console.log(`  - Adding ${mc.column} to ${mc.table}`);
                    });
                    
                    const alterResult = await this.addMissingColumns(result.missingColumns);
                    if (alterResult.success) {
                        // Re-check columns after adding
                        const recheck = await this.checkColumns();
                        if (recheck.success && recheck.data) {
                            result.missingColumns = recheck.data;
                            result.columnsOk = result.missingColumns.length === 0;
                        }
                    }
                }
            } else if (!autoFix) {
                result.message = `Missing tables: ${result.missingTables.join(', ')}`;
                return prep.response(false, result.message, result);
            }

            // Check CMS settings after structure is verified
            if (result.tablesOk && result.columnsOk) {
                // Check and optionally fix CMS settings
                const settingsCheck = await this.checkCMSSettings(autoFix);
                if (!settingsCheck.success) {
                    result.message = settingsCheck.message || 'Failed to check CMS settings';
                    return prep.response(false, result.message, result);
                }
            }

            // Build result message
            if (result.tablesOk && result.columnsOk) {
                result.message = autoFix 
                    ? 'Database consistency check passed - all required tables, columns and settings exist'
                    : 'Database consistency check passed - all tables, columns and settings exist';
                return prep.response(true, result.message, result);
            } else {
                const issues = [];
                if (!result.tablesOk) {
                    issues.push(`Missing tables: ${result.missingTables.join(', ')}`);
                }
                if (!result.columnsOk) {
                    const columnIssues = result.missingColumns.map(mc => `${mc.table}.${mc.column}`);
                    issues.push(`Missing columns: ${columnIssues.join(', ')}`);
                }
                result.message = issues.join('; ');
                return prep.response(false, result.message, result);
            }

        } catch (error) {
            const errorMsg = `Database check failed: ${error}`;
            return prep.response(false, errorMsg, {
                tablesOk: false,
                columnsOk: false,
                missingTables: [],
                missingColumns: [],
                message: errorMsg
            });
        }
    }

    /**
     * Check for missing tables (reuses existing adapter logic)
     */
    private async checkTables(): Promise<IResolve<string[]>> {
        const tablesResult = await this.db.getTables();
        
        if (!tablesResult.success || !Array.isArray(tablesResult.data)) {
            return prep.response(false, 'Failed to get table list from database', []);
        }

        const existingTables = tablesResult.data as string[];
        const requiredTables = Object.keys(schemas);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));

        return prep.response(true, 'Tables checked successfully', missingTables);
    }

    /**
     * Check for missing columns in each table
     */
    private async checkColumns(): Promise<IResolve<Array<{ table: string; column: string }>>> {
        const missingColumns: Array<{ table: string; column: string }> = [];
        const requiredTables = Object.keys(schemas);

        for (const tableName of requiredTables) {
            const tableColumnsResult = await this.getTableColumns(tableName);
            
            if (!tableColumnsResult.success || !tableColumnsResult.data) {
                return prep.response(false, `Failed to get columns for table ${tableName}`, []);
            }

            const existingColumns = tableColumnsResult.data.map(col => col.name);
            const requiredColumns = this.getRequiredColumnsFromSchema(tableName);

            for (const requiredColumn of requiredColumns) {
                if (!existingColumns.includes(requiredColumn)) {
                    missingColumns.push({ table: tableName, column: requiredColumn });
                }
            }
        }

        return prep.response(true, 'Columns checked successfully', missingColumns);
    }

    /**
     * Get column information for a specific table using PRAGMA
     */
    private async getTableColumns(tableName: string): Promise<IResolve<TableSchema[]>> {
        const query = `PRAGMA table_info('${tableName}')`;
        const result = await this.db.executeQuery(query, []);

        if (result.success && Array.isArray(result.data)) {
            const columns = result.data as unknown as TableSchema[];
            return prep.response(true, 'Columns retrieved successfully', columns);
        }

        return prep.response(false, `Failed to get columns for table ${tableName}`, []);
    }

    /**
     * Extract column names from CREATE TABLE schema
     */
    private getRequiredColumnsFromSchema(tableName: string): string[] {
        const schema = schemas[tableName as keyof typeof schemas];
        if (!schema) {
            return [];
        }

        // Extract column names from the CREATE TABLE statement
        const createTableMatch = schema.match(/CREATE TABLE[^(]*\(([\s\S]*)\)/i);
        if (!createTableMatch) {
            return [];
        }

        const tableContent = createTableMatch[1];
        const lines = tableContent.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('FOREIGN KEY') && !line.startsWith('PRIMARY KEY'));

        const columns: string[] = [];
        
        for (const line of lines) {
            // Skip constraints and empty lines
            if (line.includes('FOREIGN KEY') || line.includes('PRIMARY KEY') || 
                line.startsWith('CONSTRAINT') || line === ',' || line === '') {
                continue;
            }

            // Extract column name (first word before space)
            const trimmedLine = line.replace(/,$/, '').trim();
            const columnMatch = trimmedLine.match(/^(\w+)/);
            
            if (columnMatch) {
                columns.push(columnMatch[1]);
            }
        }

        return columns;
    }

    /**
     * Create missing tables using schemas
     */
    private async createMissingTables(tables: string[]): Promise<IResolve<void>> {
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

    /**
     * Add missing columns to existing tables
     */
    private async addMissingColumns(missingColumns: Array<{ table: string; column: string }>): Promise<IResolve<void>> {
        try {
            for (const { table, column } of missingColumns) {
                // Get column definition from schema
                const columnDef = this.getColumnDefinitionFromSchema(table, column);
                if (!columnDef) {
                    console.error(`Could not find column definition for ${table}.${column}`);
                    continue;
                }

                // Build ALTER TABLE statement
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
     * Check and fix CMS settings
     */
    private async checkCMSSettings(autoFix: boolean = false): Promise<IResolve<void>> {
        try {
            // Get default CMS settings from schema
            const { defaultCMSSettings } = await import('../db-adapter/sql-schemas');
            
            // Get system user ID for creating settings
            const systemUserResult = await this.db.executeQuery(
                "SELECT id FROM users WHERE login = 'system' LIMIT 1",
                []
            );
            
            const systemUserId = systemUserResult.success && systemUserResult.data && systemUserResult.data.length > 0
                ? systemUserResult.data[0].id
                : 'system';
            
            // Check each default setting
            for (const setting of defaultCMSSettings) {
                const checkResult = await this.db.executeQuery(
                    'SELECT setting_key FROM cms_settings WHERE setting_key = ?',
                    [setting.key]
                );
                
                // If setting doesn't exist
                if (checkResult.success && checkResult.data && checkResult.data.length === 0) {
                    if (autoFix) {
                        // Insert missing setting
                        const insertResult = await this.db.executeQuery(
                            `INSERT INTO cms_settings (setting_key, setting_value, setting_type, description, category, updated_by, updated_at) 
                             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [
                                setting.key,
                                setting.value,
                                setting.type || 'string',
                                setting.description || '',
                                setting.category || 'general',
                                systemUserId
                            ]
                        );
                        
                        if (!insertResult.success) {
                            console.error(`Failed to add CMS setting ${setting.key}: ${insertResult.message}`);
                        } else {
                            console.log(`✓ Added missing CMS setting: ${setting.key}`);
                        }
                    } else {
                        console.log(`Missing CMS setting: ${setting.key}`);
                    }
                }
            }
            
            return prep.response(true, 'CMS settings checked successfully');
        } catch (error) {
            return prep.response(false, `Error checking CMS settings: ${error}`);
        }
    }

    /**
     * Extract column definition from CREATE TABLE schema
     */
    private getColumnDefinitionFromSchema(tableName: string, columnName: string): string | null {
        const schema = schemas[tableName as keyof typeof schemas];
        if (!schema) {
            return null;
        }

        // Extract the CREATE TABLE content
        const createTableMatch = schema.match(/CREATE TABLE[^(]*\(([\s\S]*)\)/i);
        if (!createTableMatch) {
            return null;
        }

        const tableContent = createTableMatch[1];
        const lines = tableContent.split('\n').map(line => line.trim());
        
        for (const line of lines) {
            // Skip constraints and empty lines
            if (line.includes('FOREIGN KEY') || line.includes('PRIMARY KEY') || 
                line.startsWith('CONSTRAINT') || line === ',' || line === '') {
                continue;
            }

            // Remove trailing comma
            const trimmedLine = line.replace(/,$/, '').trim();
            
            // Check if this line defines our column
            const columnMatch = trimmedLine.match(/^(\w+)\s+(.+)$/);
            if (columnMatch && columnMatch[1] === columnName) {
                // Return the full column definition (name + type + constraints)
                return trimmedLine;
            }
        }

        return null;
    }
}