export const TABLE_COLUMNS = {
    records: ['id', 'title', 'description', 'content', 'image_url', 'user_id', 'tags', 'categories', 'is_published', 'created_at', 'updated_at'],
    themes: ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'created_by'],
    theme_settings: ['id', 'theme_id', 'setting_key', 'setting_value', 'type', 'created_at', 'updated_at'],
    cms_settings: ['id', 'setting_key', 'setting_value', 'type', 'description', 'category', 'updated_by', 'updated_at']
};