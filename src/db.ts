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

    public async saveSession(sessionId: string, userId: string, token: string) {
        const sessionQuery = `INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)`;
        await db.executeQuery(sessionQuery, [sessionId, userId, token]);
    }

    public async deleteSessionByUserId(userId: string): Promise<void> {
        const query = `DELETE FROM sessions WHERE user_id = ?`;
        await db.executeQuery(query, [userId]);
    }

    public async getUserProfile(userId: string): Promise<any | null> {
        const query = `SELECT public_name, is_active, roles, profile_picture_url, bio FROM user_profiles WHERE user_id = ?`;
        try {
            const rows = await db.executeQuery(query, [userId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (err) {
            console.error(messages.error, err);
            throw err; // Re-throw the error to be handled by the caller
        }
    }

    public async createUserProfile(userId: string): Promise<void> {
        const query = `INSERT INTO user_profiles (user_id, public_name, is_active, roles, profile_picture_url, bio) VALUES (?, ?, ?, ?, ?, ?)`;
        const defaultProfile = {
            public_name: 'New User',
            is_active: 1, // true
            roles: '[]', // JSON array string
            profile_picture_url: '',
            bio: ''
        };
        await db.executeQuery(query, [userId, defaultProfile.public_name, defaultProfile.is_active, defaultProfile.roles, defaultProfile.profile_picture_url, defaultProfile.bio]);
    }

    public async updateUserProfile(userId: string, profile: Partial<{ public_name: string, is_active: number, roles: string, profile_picture_url: string, bio: string }>): Promise<void> {
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        if (fieldsToUpdate.length === 0) {
            return; // Nothing to update
        }
        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => (profile as any)[field]);
        values.push(userId);

        const query = `UPDATE user_profiles SET ${setClauses} WHERE user_id = ?`;
        await db.executeQuery(query, values);
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
