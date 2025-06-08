import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';

const db = new adapter();

class Database {
    // connect to the database or create it if it doesn't exist
    constructor() {
        this.initialize();
    }

    private async initialize() {
        console.log(await db.checkTables());
    }

    public async registerUser(user: any) {
        const { id, login, email, passwordHash } = user;
        const query = `INSERT INTO users (id, login, email, passwordHash) VALUES (?, ?, ?, ?)`;
        try {
            await db.executeQuery(query, [id, login, email, passwordHash]);
 return { success: true, message: 'User registered successfully.' };
        } catch (err: any) {
            console.error('Database error during registration:', err); // More specific logging
 let errorMessage: string = 'An unknown error occurred.';
            if (typeof err === 'string') {
                if (err.includes('UNIQUE constraint failed: users.email')) {
                    errorMessage = 'User with this email already exists.';
                } else if (err.includes('UNIQUE constraint failed: users.login')) {
                    errorMessage = 'User with this login already exists.';
                } else if (err.includes('UNIQUE constraint failed: users.id')) {
                    errorMessage = 'User with this ID already exists.';
                }
            }
            return { success: false, message: errorMessage };
        }
    }

    public async findUserByLogin(login: string): Promise<any | null> {
        const query = `SELECT id, login, email, passwordHash FROM users WHERE login = ? OR email = ?`;
        try {
            const rows = await db.executeQuery(query, [login, login]);
            return rows.length > 0 ? rows[0] : null;
        } catch (err) {
            console.error(messages.error, err);
            throw err; // Re-throw the error to be handled by the caller
        }
    }
};

const database = new Database();
export default database;
