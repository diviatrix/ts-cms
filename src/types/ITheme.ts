/**
 * Theme-related TypeScript interfaces
 */

export interface ITheme {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    is_default: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface IThemeSetting {
    theme_id: string;
    setting_key: string;
    setting_value: string;
    setting_type: 'string' | 'number' | 'boolean' | 'color' | 'font' | 'json';
}

export interface IUserThemePreference {
    user_id: string;
    theme_id: string;
    custom_settings: Record<string, any>;
    updated_at: string;
}

export interface IThemeConfig {
    // CSS Variables
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    
    // Typography
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
    
    // Layout
    maxWidth?: string;
    spacing?: string;
    borderRadius?: string;
    
    // Branding
    faviconUrl?: string;
    logoUrl?: string;
    
    // Custom CSS
    customCss?: string;
    
    // External resources
    googleFonts?: string[];
    externalCss?: string[];
}

export interface IThemeAPI {
    // Theme CRUD
    createTheme(theme: Omit<ITheme, 'id' | 'created_at' | 'updated_at'>): Promise<ITheme>;
    getTheme(id: string): Promise<ITheme | null>;
    getThemes(): Promise<ITheme[]>;
    updateTheme(id: string, updates: Partial<ITheme>): Promise<ITheme>;
    deleteTheme(id: string): Promise<boolean>;
    
    // Theme settings
    getThemeSettings(themeId: string): Promise<IThemeSetting[]>;
    setThemeSetting(themeId: string, key: string, value: string, type?: string): Promise<boolean>;
    deleteThemeSetting(themeId: string, key: string): Promise<boolean>;
    
    // User preferences
    getUserThemePreference(userId: string): Promise<IUserThemePreference | null>;
    setUserThemePreference(userId: string, themeId: string, customSettings?: Record<string, any>): Promise<boolean>;
    
    // Active theme management
    getActiveTheme(): Promise<ITheme | null>;
    setActiveTheme(themeId: string): Promise<boolean>;
    getDefaultTheme(): Promise<ITheme | null>;
    setDefaultTheme(themeId: string): Promise<boolean>;
}
