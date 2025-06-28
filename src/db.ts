import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';
import IUser from './types/IUser';
import IUserProfile from './types/IUserProfile';
import IResolve from './types/IResolve';
import prep from './utils/prepare'

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
        if (data && typeof data.roles === 'string') {
            try {
                data.roles = JSON.parse(data.roles);
            } catch (e) {
                console.error("Error parsing roles from database:", e);
                data.roles = []; // Default to empty array on parse error
            }
        }
        return prep.response(response.success, response.message, data);
    }

    public async createUserProfile(userId: string): Promise<IResolve<IUserProfile>> {
        // Define the default profile data based on the IUserProfile interface
        const defaultProfile: IUserProfile = {
            user_id: userId,
            public_name: 'User', // Default public name
            is_active: true, // true (SQLite boolean equivalent)
            roles: ['user'], // Default role
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
        if (data && typeof data.roles === 'string') {
            try {
                data.roles = JSON.parse(data.roles);
            } catch (e) {
                console.error("Error parsing roles from database:", e);
                data.roles = []; // Default to empty array on parse error
            }
        }
        return prep.response(response.success, response.message, data);
    }

    public async updateUserProfile(userId: string, profile: Partial<IUserProfile>): Promise<IResolve<IUserProfile | undefined>> {
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        
        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => {
            if (field === 'is_active') {
                return `${field} = ?`; // Handle boolean conversion below
            } else if (field === 'roles') {
                return `${field} = ?`; // Handle JSON string conversion below
            }
            return `${field} = ?`;
        }).join(', ');

        const values = fieldsToUpdate.map(field => {
            if (field === 'is_active') return profile[field] ? 1 : 0; // Convert boolean to SQLite integer
            if (field === 'roles') return JSON.stringify(profile[field]); // Convert array to JSON string
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
    
}

export default Database.getInstance();
