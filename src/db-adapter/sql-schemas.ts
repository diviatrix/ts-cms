export default {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY UNIQUE NOT NULL,
            login TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
        )`,
    records: `
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            categories TEXT NOT NULL DEFAULT '[]',
            is_published BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
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
            user_id TEXT PRIMARY KEY UNIQUE NOT NULL,
            public_name TEXT NOT NULL,
            profile_picture_url TEXT,
            bio TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`
    ,
    user_groups: `
        CREATE TABLE IF NOT EXISTS user_groups (
            user_id TEXT NOT NULL,
            group_id TEXT NOT NULL,
            PRIMARY KEY (user_id, group_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES roles(id) ON DELETE CASCADE
        )`
    ,
    sessions: `
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
    themes: `
        CREATE TABLE IF NOT EXISTS themes (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )`,
    theme_settings: `
        CREATE TABLE IF NOT EXISTS theme_settings (
            theme_id TEXT NOT NULL,
            setting_key TEXT NOT NULL,
            setting_value TEXT NOT NULL,
            setting_type TEXT NOT NULL DEFAULT 'string',
            PRIMARY KEY (theme_id, setting_key),
            FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
        )`,
    user_theme_preferences: `
        CREATE TABLE IF NOT EXISTS user_theme_preferences (
            user_id TEXT PRIMARY KEY NOT NULL,
            theme_id TEXT NOT NULL,
            custom_settings TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
        )`
};