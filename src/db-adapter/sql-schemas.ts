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
            image_url TEXT,
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
        )`,
    cms_settings: `
        CREATE TABLE IF NOT EXISTS cms_settings (
            setting_key TEXT PRIMARY KEY NOT NULL,
            setting_value TEXT NOT NULL,
            setting_type TEXT NOT NULL DEFAULT 'string',
            description TEXT,
            category TEXT NOT NULL DEFAULT 'general',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT NOT NULL
        )`,
    invites: `
        CREATE TABLE IF NOT EXISTS invites (
            id TEXT PRIMARY KEY NOT NULL,
            code TEXT UNIQUE NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            used_by TEXT,
            used_at TEXT,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (used_by) REFERENCES users (id) ON DELETE SET NULL
        )`
};

// Default data for database initialization
export const defaultRoles = [
    { id: 'user', name: 'User', description: 'Standard user role', weight: 10, perms: '[]' },
    { id: 'admin', name: 'Admin', description: 'Administrator role with full access', weight: 100, perms: '[]' },
    { id: 'guest', name: 'Guest', description: 'Guest user role with limited access', weight: 0, perms: '[]' },
];

export const defaultThemeSettings = [
    { key: 'primary_color', value: '#00FF00' },      // Neon green (accent)
    { key: 'secondary_color', value: '#FFD700' },    // Warm yellow (accent)
    { key: 'background_color', value: '#222222' },   // Dark grey (main background)
    { key: 'surface_color', value: '#444444' },      // Grey (cards, surfaces)
    { key: 'text_color', value: '#E0E0E0' },         // Light grey (primary text)
    { key: 'text_secondary', value: '#C0C0C0' },     // Medium grey (secondary text)
    { key: 'text_muted', value: '#A0A0A0' },         // Darker grey (muted text)
    { key: 'border_color', value: '#00FF00' },       // Neon green (borders)
    { key: 'font_family', value: "'Share Tech Mono', monospace" },
    { key: 'custom_css', value: '' },
    { key: 'favicon_url', value: '' },
    { key: 'logo_url', value: '' },
    { key: 'footer_text', value: '© 2025 TypeScript CMS. Built with modern web technologies.' },
    { key: 'footer_links', value: '[]' },
    { key: 'menu_links', value: '[]' }
];

export const defaultTheme = {
    name: 'Default Theme',
    description: 'Default TypeScript CMS theme with modern dark styling',
    is_active: true,
    is_default: true
};

export const defaultCMSSettings = [
    { key: 'site_name', value: 'TypeScript CMS', type: 'string', description: 'Website name', category: 'general' },
    { key: 'site_description', value: 'Modern CMS built with TypeScript', type: 'string', description: 'Website description', category: 'general' },
    { key: 'active_theme_id', value: '', type: 'string', description: 'Currently active website theme', category: 'theme' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Site maintenance mode', category: 'general' },
    { key: 'allow_registration', value: 'true', type: 'boolean', description: 'Allow new user registration', category: 'security' },
    { key: 'registration_mode', value: 'OPEN', type: 'string', description: 'Registration mode: OPEN, CLOSED, or INVITE_ONLY', category: 'security' },
    { key: 'default_user_role', value: 'user', type: 'string', description: 'Default role for new users', category: 'security' },
    { key: 'api_docs_enabled', value: 'false', type: 'boolean', description: 'Enable API documentation at /api-docs', category: 'api' }
];