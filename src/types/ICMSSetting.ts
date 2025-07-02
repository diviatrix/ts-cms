export interface ICMSSetting {
    setting_key: string;
    setting_value: string;
    setting_type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    category: 'general' | 'theme' | 'security' | 'content';
    updated_at: string;
    updated_by: string;
}

export interface ICMSSettingUpdate {
    setting_value: string;
    setting_type?: 'string' | 'number' | 'boolean' | 'json';
    updated_by: string;
}
