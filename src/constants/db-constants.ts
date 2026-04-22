// Large database constants extracted from src/db.ts
// These are used across multiple database operations

// Table column mappings for dynamic queries
export const TABLE_COLUMNS = {
  records: ['id', 'title', 'description', 'content', 'image_url', 'user_id', 'tags', 'categories', 'is_published', 'created_at', 'updated_at'],
  themes: ['id', 'name', 'description', 'is_default', 'is_active', 'created_at', 'updated_at'],
  theme_settings: ['id', 'theme_id', 'setting_key', 'setting_value'],
  cms_settings: ['id', 'setting_key', 'setting_value', 'description']
};


// Legacy data object for backward compatibility
export const DEFAULT_DATA = {
  // Add any needed default data structures here
};
