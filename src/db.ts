import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';
import IUser from './types/IUser';
import IUserProfile from './types/IUserProfile';
import IResolve from './types/IResolve';
import prep from './utils/prepare'
import IRecord from './types/IRecord';

class Database {
    private static instance: Database;
    private db: adapter;

    private constructor() {
        console.log('Database constructor called.');
        this.db = new adapter();
        this.initialize();
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async initialize() {
        console.log(await this.db.checkTables());
    }

    public async registerUser(user: IUser): Promise<IResolve<IUser>> {
        const columns = Object.keys(user).join(', ');
        const placeholders = Object.keys(user).map(() => '?').join(', ');
        const values = Object.values(user);
        const query = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, user);
    }

    public async saveSession(sessionId: string, userId: string, token: string): Promise<IResolve<string>>  {
        const sessionQuery = `INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)`;
        const response = await this.db.executeQuery(sessionQuery, [sessionId, userId, token]);
        return prep.response(response.success, response.message, sessionId);
    }

    public async deleteSessionByUserId(userId: string): Promise<IResolve<string>> {
        const query = `DELETE FROM sessions WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        return prep.response(response.success, response.message, userId);
    }

    public async getUserProfile(userId: string): Promise<IResolve<IUserProfile | undefined>> {
        const query = `SELECT * FROM user_profiles WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        const data = (response.data && response.data.length > 0)
            ? (response.data[0] as unknown as IUserProfile)
            : undefined;
        // Roles are now fetched separately
        return prep.response(response.success, response.message, data);
    }

    public async createUserProfile(userId: string): Promise<IResolve<IUserProfile>> {
        // Define the default profile data based on the IUserProfile interface
        const defaultProfile: IUserProfile = {
            user_id: userId,
            public_name: 'User', // Default public name
            is_active: true, // true (SQLite boolean equivalent)
            profile_picture_url: '/img/placeholder-square.png',
            bio: 'Я родился', // Default empty bio
            created_at: new Date(),
            updated_at: new Date()
        };
        const columns = Object.keys(defaultProfile).join(', ');
        const placeholders = Object.keys(defaultProfile).map(() => '?').join(', ');
        const values = Object.values(defaultProfile).map(value => typeof value === 'object' ? JSON.stringify(value) : value); // Stringify roles array
        const query = `INSERT INTO user_profiles (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        if (response.success) {
            // Add user to default 'user' group
            await this.addUserToGroup(userId, 'user');
            // If successful, return the defaultProfile as the created profile
            return prep.response(true, messages.success, defaultProfile);
        } else {
            return prep.response(false, messages.failure, undefined as unknown as IUserProfile);
        }
    }

    

    public async findUserByLogin(login: string): Promise<IResolve<IUser | undefined>> {
        const response = await this.db.executeQuery(`SELECT * FROM users WHERE login = ? OR email = ?`, [login, login]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUser) : undefined;
        return prep.response(response.success, response.message, data);
    }

    public async getUser(id: string): Promise<IResolve<IUser | undefined>> {
        const response = await this.db.executeQuery(`SELECT * FROM users WHERE id = ?`, [id]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUser) : undefined;
        return prep.response(response.success, response.message, data);
    }

    public async getAllBaseUsers(): Promise<IResolve<IUser[] | undefined>> {
        const response = await this.db.executeQuery("SELECT * FROM users", []);
        const users = Array.isArray(response.data) ? (response.data as unknown as IUser[]) : undefined;
        return prep.response(response.success, response.message, users);
    }

    public async getUserProfileById(userId: string): Promise<IResolve<IUserProfile>> {
        const response = await this.db.executeQuery("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUserProfile) : undefined;
        // Roles are now fetched separately
        return prep.response(response.success, response.message, data);
    }

    public async getUserRoles(userId: string): Promise<IResolve<string[]>> {
        const query = `SELECT group_id FROM user_groups WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        if (response.success && Array.isArray(response.data)) {
            const roles = response.data.map((row: any) => row.group_id);
            return prep.response(true, messages.success, roles);
        }
        return prep.response(false, messages.failure, []);
    }

    public async addUserToGroup(userId: string, groupId: string): Promise<IResolve<boolean>> {
        const query = `INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES (?, ?)`;
        const response = await this.db.executeQuery(query, [userId, groupId]);
        return prep.response(response.success, response.message, response.success);
    }

    public async removeUserFromGroup(userId: string, groupId: string): Promise<IResolve<boolean>> {
        const query = `DELETE FROM user_groups WHERE user_id = ? AND group_id = ?`;
        const response = await this.db.executeQuery(query, [userId, groupId]);
        return prep.response(response.success, response.message, response.success);
    }

    public async updateUserProfile(userId: string, profile: Partial<IUserProfile>): Promise<IResolve<IUserProfile | undefined>> {
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        
        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => {
            if (field === 'is_active') {
                return `${field} = ?`; // Handle boolean conversion below
            }
            return `${field} = ?`;
        }).join(', ');

        const values = fieldsToUpdate.map(field => {
            if (field === 'is_active') return profile[field] ? 1 : 0; // Convert boolean to SQLite integer
            return (profile as any)[field];
        });
        values.push(userId);

        const query = `UPDATE user_profiles SET ${setClauses} WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async updateUser(userId: string, userData: Partial<IUser>): Promise<IResolve<IUser | undefined>> {
        console.log('Database: updateUser called for userId:', userId, 'with user data:', userData);
        const fieldsToUpdate = Object.keys(userData).filter(key => (userData as any)[key] !== undefined);

        if (fieldsToUpdate.length === 0) {
            console.log('Database: No fields to update in updateUser.');
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => (userData as any)[field]);
        values.push(userId);

        const query = `UPDATE users SET ${setClauses} WHERE id = ?`;
        console.log('Database: Executing updateUser query:', query, 'with values:', values);
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async createRecord(record: IRecord): Promise<IResolve<IRecord>> {
        const columns = ['id', 'title', 'description', 'content', 'user_id', 'tags', 'categories', 'is_published', 'created_at', 'updated_at'].join(', ');
        const placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?'].join(', ');
        const values = [
            record.id,
            record.title,
            record.description,
            record.content,
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
        const fieldsToUpdate = Object.keys(updates).filter(key => (updates as any)[key] !== undefined);

        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => {
            if (field === 'tags' || field === 'categories') {
                return `${field} = ?`;
            } else if (field === 'is_published') {
                return `${field} = ?`;
            } else if (field === 'created_at' || field === 'updated_at') {
                return `${field} = ?`;
            }
            return `${field} = ?`;
        }).join(', ');

        const values = fieldsToUpdate.map(field => {
            if (field === 'tags' || field === 'categories') return JSON.stringify((updates as any)[field]);
            if (field === 'is_published') return (updates as any)[field] ? 1 : 0;
            if (field === 'created_at' || field === 'updated_at') return (updates as any)[field].toISOString();
            return (updates as any)[field];
        });
        values.push(id);

        const query = `UPDATE records SET ${setClauses} WHERE id = ?`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async deleteRecord(id: string): Promise<IResolve<boolean>> {
        const query = `DELETE FROM records WHERE id = ?`;
        const response = await this.db.executeQuery(query, [id]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getAllRecords(publishedOnly: boolean = false): Promise<IResolve<(IRecord & { public_name: string })[] | undefined>> {
        let query = `
            SELECT
                r.id, r.title, r.description, r.content, r.user_id,
                r.tags, r.categories, r.is_published, r.created_at, r.updated_at,
                COALESCE(up.public_name, 'Admin') as public_name
            FROM records r
            LEFT JOIN user_profiles up ON r.user_id = up.user_id
        `;
        const params: any[] = [];
        if (publishedOnly) {
            query += ` WHERE r.is_published = 1`;
        }
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
    
}

export default Database.getInstance();
