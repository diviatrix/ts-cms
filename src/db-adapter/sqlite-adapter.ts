import * as sqlite3 from 'sqlite3';
import config from '../data/config';
import schemas from './sql-schemas';
import messages from '../data/messages';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare'

// For more detailed logs from the sqlite3 driver, you can uncomment the next line:
// const sqlite = sqlite3.verbose();

export default class SQLiteAdapter {
    private db: sqlite3.Database | null = null;

    constructor() {
        this.connect();
    }

    public async connect() {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure directory exists
        const dbDir = path.dirname(config.db_path);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new sqlite3.Database(config.db_path, (err) => {
            if (err) {
                console.error(messages.sql_connect_error, err);
            } else {
                this.getStatus().then(status => {
                    console.log(status);
                });
            }
        });
    }

    public async checkTables(): Promise<IResolve<string[]>> {
        if (!this.db) {
            console.error(messages.sql_connect_error);
            return prep.response(false, messages.sql_connect_error);
        }

        const tablesResult = await this.getTables();
        
        if (!tablesResult.success || !Array.isArray(tablesResult.data)) {
            console.error("Failed to get table list from database:", tablesResult.message);
            return prep.response(false, "Failed to check tables due to a database error.");
        }

        const existingTables = tablesResult.data as string[]; // Cast the data to string[]
        const missingTables = Object.keys(schemas).filter((table) => !existingTables.includes(table));

        if (missingTables.length > 0) {
            console.log(messages.sql_missing_tables, missingTables);
            await this.createTables(missingTables);
            return prep.response(true, `Tables created: ${missingTables.join(', ')}`);
        } else {
            return prep.response(true, messages.sql_all_tables_exist);
        }
    }

    public async getTables(): Promise<IResolve<string[]>> {
        const query = "SELECT name FROM sqlite_master WHERE type='table'";
        const result = await this.executeQuery(query);

        if (result.success && Array.isArray(result.data)) {
            const rows = result.data as unknown[];
            const tableNames = (rows as Array<{ name: string }>).map(row => row.name);
            return prep.response(true, messages.sql_query_success, tableNames);
        }
        return prep.response(result.success, result.message, []); // Return the original error result from executeQuery
    }

    public async createTables(tables: string[]): Promise<IResolve<string[]>> {
        for (const table of tables) {
            const schema = schemas[table as keyof typeof schemas];
            if (schema) {
                const response = await this.executeQuery(schema);
                if (response.success) {
                    console.log(messages.sql_create_table_success, table);
                } else {
                    console.error(messages.sql_create_table_error, table, response.message);
                }                
            } else {
                console.error(messages.sql_schema_not_found, table);
            }
        }

        return prep.response(true, messages.success, tables);
    }

    public async createTable(schema: string): Promise<IResolve<string[]>> {
        const response = await this.executeQuery(schema);
        return prep.response(response.success, response.message, response.data);
    }

    public async close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error(messages.sql_close_error, err);
                } else {
                    console.log(messages.sql_close_success);
                }
            });
        }
    }

    public async executeQuery(query: string, params: any[] = []): Promise<IResolve<string[]>> {
        return new Promise((resolve) => {
            this.db?.all(query, params, (err, rows: any[]) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, [err.toString()]));
                } else {
                    resolve(prep.response(true, messages.sql_query_success, rows));
                }
            });
        });
    }

    public async getByTableColValue(table: string, col: string, value: any): Promise<IResolve<string>> {
        return new Promise((resolve) => {
            this.db?.get(`SELECT * FROM ${table} WHERE ${col} = ?`, [value], (err, row) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, err.toString()));
                } else  {
                    resolve(prep.response(true, messages.sql_query_success, row as unknown as string));
                }
            });
        });
    }

    public async getStatus(): Promise<IResolve<string>> {
        return new Promise((resolve) => {
            this.db?.get("SELECT sqlite_version() AS version", (err, row: { version: string }) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_connect_error, err.toString()));
                } else {
                    resolve(prep.response(true, messages.sql_connect_success, row.version));
                }
            });
        });
    }
};
