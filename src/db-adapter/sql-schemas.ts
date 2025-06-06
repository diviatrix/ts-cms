export default {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            login TEXT NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL
        )`,
    records: `
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            categories TEXT NOT NULL DEFAULT '[]',
            is_published BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users (id)
        )`,
    stats:`
        CREATE TABLE IF NOT EXISTS stats (
            id TEXT PRIMARY KEY NOT NULL,
            date TEXT NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            FOREIGN KEY (id) REFERENCES users (id)
        )`,
    roles: `
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            weight INTEGER NOT NULL DEFAULT 0,
            perms TEXT NOT NULL DEFAULT '[]'
        )`,
    files: `
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER NOT NULL,
            type TEXT NOT NULL DEFAULT 'application/octet-stream',
            url TEXT NOT NULL,
            created_by TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            categories TEXT NOT NULL DEFAULT '[]',
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )`,
    user_profiles: `
        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY NOT NULL,
            public_name TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            roles TEXT NOT NULL DEFAULT '[]',
            profile_picture_url TEXT,
            bio TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id) REFERENCES users (id)
        )`
};