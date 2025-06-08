import * as sqlite3 from 'sqlite3';
import config from '../data/config';
import schemas from './sql-schemas';
import messages from '../data/messages';

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
    public async checkTables(): Promise<string> {
        if (!this.db) {
            console.error(messages.sql_connect_error);
            return messages.sql_connect_error;
        }

        const tables = await this.getTables();
        const missingTables = Object.keys(schemas).filter((table) => !tables.includes(table));

        if (missingTables.length > 0) {
            console.log(messages.sql_missing_tables, missingTables);
            await this.createTables(missingTables);
            return `Tables created: ${missingTables.join(', ')}`;
        } else {
            return messages.sql_all_tables_exist;
        }
    }
    public async getTables(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.db?.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve((rows as Array<{ name: string }>).map(row => row.name));
                }
            });
        });
    }
    public async createTables(tables: string[]) {
        for (const table of tables) {
            const schema = schemas[table as keyof typeof schemas];
            if (schema) {
                await this.createTable(table, schema);
            } else {
                console.error(messages.sql_schema_not_found, table);
            }
        }
    }
    public async createTable(table: string, schema: string) {
        return new Promise((resolve, reject) => {
            this.db?.run(schema, (err) => {
                if (err) {
                    console.error(messages.sql_create_table_error, table, err);
                    reject(err);
                } else {
                    console.log(messages.sql_create_table_success, table);
                    resolve(true);
                }
            });
        });
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
    public async executeQuery(query: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db?.all(query, params, (err, rows) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(rows);
                }

            });
        });
    }
    public async getByTableColValue(table: string, col: string, value: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db?.get(`SELECT * FROM ${table} WHERE ${col} = ?`, [value], (err, row) => {
                if (err) {
                    console.error(messages.sql_query_error, err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
    public async getStatus(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.db?.get("SELECT sqlite_version() AS version", (err, row: { version: string }) => {
                if (err) {
                    reject(messages.sql_connect_error + " " + err);
                } else {
                    resolve(messages.sql_connect_success + " " + row.version);
                }
            });
        });
    }
};
