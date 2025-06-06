import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';

const db = new adapter();

export default class Database {
    // connect to the database or create it if it doesn't exist
    constructor() {
        this.initialize();
    }

    private async initialize() {
        console.log(await db.checkTables());
    }

    public async registerUser(user: any) {
        const { id, login, email, password_hash } = user;
        const query = `INSERT INTO users (id, login, email, password_hash) VALUES (?, ?, ?, ?)`;
        try {
            await db.executeQuery(query, [id, login, email, password_hash]);
            return { id, login, email };
        } catch (err) {
            console.error(messages.error, err);
            throw err;
        }
    }
};
