import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';
import IUser from './types/IUser';
import IUserProfile from './types/IUserProfile';
import IResolve from './types/IResolve';
import prep from './utils/prepare'

const db = new adapter();
class Database {
    // connect to the database or create it if it doesn't exist
    constructor() {
        this.initialize();
    }

    private async initialize() {
        console.log(await db.checkTables());
    }

    public async registerUser(user: IUser): Promise<IResolve> {
        const columns = Object.keys(user).join(', ');
        const placeholders = Object.keys(user).map(() => '?').join(', ');
        const values = Object.values(user);
        const query = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
        return await db.executeQuery(query, values);
    }

    public async saveSession(sessionId: string, userId: string, token: string): Promise<IResolve>  {
        const sessionQuery = `INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)`;
        return await db.executeQuery(sessionQuery, [sessionId, userId, token]);
    }

    public async deleteSessionByUserId(userId: string): Promise<IResolve> {
        const query = `DELETE FROM sessions WHERE user_id = ?`;
        return await db.executeQuery(query, [userId]);         
    }

    public async getUserProfile(userId: string): Promise<IResolve> {
        const query = `SELECT * FROM user_profiles WHERE user_id = ?`;
        const response = await db.executeQuery(query, [userId]);
        const data = response.data[0] as IUserProfile;
        return prep.response(response.success, response.message, data);
    }

    public async createUserProfile(userId: string): Promise<IResolve> {
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
        return await db.executeQuery(query, values);
    }

    public async updateUserProfile(userId: string, profile: Partial<IUserProfile>): Promise<IResolve> {
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.nothing_to_do, null); // Nothing to update
        }
        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => (profile as any)[field]);
        values.push(userId);

        const query = `UPDATE user_profiles SET ${setClauses} WHERE user_id = ?`;
        return await db.executeQuery(query, values);
    }

    public async findUserByLogin(login: string): Promise<IResolve> {
        const response = await db.executeQuery(`SELECT * FROM users WHERE login = ? OR email = ?`, [login, login]);
        const data = response.data.length > 0 ? (response.data[0] as IUser) : null;
        return prep.response(response.success, response.message, data);
    }

    public async getAllBaseUsers(): Promise<IResolve> {
        const response = await db.executeQuery("SELECT * FROM users", []);
        return prep.response(response) 
    }

    public async getUserProfileById(userId: string): Promise<IResolve> {
        const response = await db.executeQuery("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
        const data = response.data.length > 0 ? (response.data[0] as IUserProfile) : null;
        return prep.response(response.success, response.message, data);
    }

    public async adminUpdateUserProfile(userId: string, profile: Partial<IUserProfile>): Promise<IResolve> {
        console.log('Database: adminUpdateUserProfile called for userId:', userId, 'with profile data:', profile);
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        
        if (fieldsToUpdate.length === 0) {
            console.log('Database: No fields to update in adminUpdateUserProfile.');
            return prep.response(true, messages.success, null); // Nothing to update
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
        console.log('Database: Executing adminUpdateUserProfile query:', query, 'with values:', values);
        return db.executeQuery(query, values);
    }
};

const database = new Database();
export default database;
