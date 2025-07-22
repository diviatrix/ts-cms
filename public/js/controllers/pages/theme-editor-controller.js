import { ThemesAPI, apiFetch } from '../../core/api-client.js';
import { applyThemeFromSettings, getCurrentTheme } from '../../modules/theme-system.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class ThemeEditorController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('themeEditorContent');
        this.themeId = null;
        this.theme = null;
        this.settings = null;
        this.originalSettings = null;
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        // Get theme ID from URL
        const params = new URLSearchParams(window.location.search);
        this.themeId = params.get('id');
        
        if (this.themeId) {
            await this.loadTheme();
        } else {
            this.initNewTheme();
        }
        
        this.render();
    }

    async loadTheme() {
        await this.safeApiCall(
            () => ThemesAPI.getById(this.themeId),
            {
                successCallback: (data) => {
                    this.theme = data.theme;
                    
                    // Transform settings array to object if needed
                    let settings = data.settings || {};
                    if (Array.isArray(settings)) {
                        const transformed = {};
                        settings.forEach(item => {
                            transformed[item.setting_key] = item.setting_value;
                        });
                        settings = transformed;
                    }
                    
                    // Map old property names to new ones for the editor
                    this.settings = {
                        primary: settings.primary_color || settings.primary || '#3cff7a',
                        secondary: settings.secondary_color || settings.secondary || '#444444',
                        background: settings.background_color || settings.background || '#222222',
                        surface: settings.surface_color || settings.surface || '#2a2a2a',
                        text: settings.text_color || settings.text || '#e0e0e0',
                        border: settings.border_color || settings.border || '#444444',
                        muted: settings.muted_color || settings.muted || '#aaa',
                        error: settings.error_color || settings.error || '#ff3c3c',
                        success: settings.success_color || settings.success || '#3cff7a',
                        font_family: settings.font_family || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        font_size: settings.font_size || '1rem',
                        radius: settings.radius || '1rem',
                        spacing: settings.spacing || '0.5rem',
                        shadow: settings.shadow || '0 4px 24px rgba(0,0,0,0.10)',
                        custom_css: settings.custom_css || ''
                    };
                    this.originalSettings = { ...this.settings };
                },
                errorCallback: () => {
                    notifications.error('Failed to load theme');
                    setTimeout(() => {
                        window.location.href = '/pages/themes-manage-page.html';
                    }, 2000);
                }
            }
        );
    }

    initNewTheme() {
        this.theme = {
            name: '',
            description: '',
            is_active: false
        };
        
        // Get current theme as base - use computed styles to get actual values
        const computed = getComputedStyle(document.documentElement);
        this.settings = {
            // Core colors
            primary: computed.getPropertyValue('--primary').trim() || '#3cff7a',
            secondary: computed.getPropertyValue('--secondary').trim() || '#444444',
            background: computed.getPropertyValue('--background').trim() || '#222222',
            surface: computed.getPropertyValue('--surface').trim() || '#2a2a2a',
            text: computed.getPropertyValue('--text').trim() || '#e0e0e0',
            border: computed.getPropertyValue('--border').trim() || '#444444',
            
            // Additional colors
            muted: computed.getPropertyValue('--muted').trim() || '#aaa',
            error: computed.getPropertyValue('--error').trim() || '#ff3c3c',
            success: computed.getPropertyValue('--success').trim() || '#3cff7a',
            
            // Typography
            font_family: computed.getPropertyValue('--font-family').trim() || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            font_size: computed.getPropertyValue('--font-size').trim() || '1rem',
            
            // Layout
            radius: computed.getPropertyValue('--radius').trim() || '1rem',
            spacing: computed.getPropertyValue('--spacing').trim() || '0.5rem',
            shadow: computed.getPropertyValue('--shadow').trim() || '0 4px 24px rgba(0,0,0,0.10)',
            
            // Custom CSS
            custom_css: ''
        };
        this.originalSettings = { ...this.settings };
    }

    render() {
        const isNew = !this.themeId;
        
        this.container.innerHTML = `
            <form id="themeForm">
                <div class="card-grid">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Theme Information</h3>
                            
                            <label for="themeName">Theme Name</label>
                            <input type="text" id="themeName" value="${this.theme.name || ''}" required placeholder="My Custom Theme">
                            
                            <label for="themeDescription">Description</label>
                            <textarea id="themeDescription" rows="3" placeholder="A brief description of your theme">${this.theme.description || ''}</textarea>
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="themeActive" ${this.theme.is_active ? 'checked' : ''}>
                                Make Available for Selection
                            </label>
                            <small class="form-hint">When checked, this theme will appear in the list of available themes that can be applied to the website</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Core Colors</h3>
                            
                            <div class="color-grid">
                                ${this.renderColorInput('primary', 'Primary Color', this.settings.primary)}
                                ${this.renderColorInput('secondary', 'Secondary Color', this.settings.secondary)}
                                ${this.renderColorInput('background', 'Background Color', this.settings.background)}
                                ${this.renderColorInput('surface', 'Surface Color', this.settings.surface)}
                                ${this.renderColorInput('text', 'Text Color', this.settings.text)}
                                ${this.renderColorInput('border', 'Border Color', this.settings.border)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Additional Colors</h3>
                            
                            <div class="color-grid">
                                ${this.renderColorInput('muted', 'Muted Text', this.settings.muted)}
                                ${this.renderColorInput('error', 'Error Color', this.settings.error)}
                                ${this.renderColorInput('success', 'Success Color', this.settings.success)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-2">
                    <div class="card-body">
                        <h3 class="card-title">Typography</h3>
                        
                        <label for="fontFamily">Font Family</label>
                        <input type="text" id="fontFamily" value="${this.settings.font_family || ''}" 
                               placeholder="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                        <small class="form-hint">Enter a CSS font-family value</small>
                        
                        <label for="fontSize">Base Font Size</label>
                        <input type="text" id="fontSize" value="${this.settings.font_size || ''}" 
                               placeholder="1rem">
                        <small class="form-hint">Base font size (e.g., 16px, 1rem)</small>
                    </div>
                </div>
                
                <div class="card mt-2">
                    <div class="card-body">
                        <h3 class="card-title">Layout</h3>
                        
                        <div class="form-row">
                            <div>
                                <label for="radius">Border Radius</label>
                                <input type="text" id="radius" value="${this.settings.radius || ''}" 
                                       placeholder="1rem">
                                <small class="form-hint">Corner rounding (e.g., 0.5rem, 8px)</small>
                            </div>
                            
                            <div>
                                <label for="spacing">Base Spacing</label>
                                <input type="text" id="spacing" value="${this.settings.spacing || ''}" 
                                       placeholder="0.5rem">
                                <small class="form-hint">Base spacing unit (e.g., 0.5rem, 8px)</small>
                            </div>
                        </div>
                        
                        <label for="shadow">Box Shadow</label>
                        <input type="text" id="shadow" value="${this.settings.shadow || ''}" 
                               placeholder="0 4px 24px rgba(0,0,0,0.10)">
                        <small class="form-hint">CSS box-shadow value</small>
                    </div>
                </div>
                
                <div class="card mt-2">
                    <div class="card-body">
                        <h3 class="card-title">Custom CSS</h3>
                        
                        <label for="customCSS">Additional CSS</label>
                        <textarea id="customCSS" rows="10" placeholder="/* Add custom CSS here */">${this.settings.custom_css || ''}</textarea>
                        <small class="form-hint">Add any additional CSS rules to customize the theme further</small>
                    </div>
                </div>
                
                <div class="theme-actions mt-2">
                    <button type="submit" class="btn">${isNew ? 'Create Theme' : 'Save Changes'}</button>
                    <button type="button" class="btn btn-secondary" onclick="window.themeEditor.previewChanges()">Preview</button>
                    <button type="button" class="btn btn-secondary" onclick="window.themeEditor.resetChanges()">Reset</button>
                    <a href="/pages/themes-manage-page.html" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        `;
        
        // Attach event listeners
        document.getElementById('themeForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Attach color input listeners for live preview and synchronization
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', (e) => {
                // Sync with text input
                const textInput = document.getElementById(e.target.id + '_text');
                if (textInput) {
                    textInput.value = e.target.value;
                }
                this.previewChanges();
            });
        });
        
        // Attach text input listeners for color synchronization
        document.querySelectorAll('[id$="_text"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const colorInputId = e.target.id.replace('_text', '');
                const colorInput = document.getElementById(colorInputId);
                if (colorInput && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    this.previewChanges();
                }
            });
        });
        
        window.themeEditor = this;
    }

    renderColorInput(id, label, value) {
        // Ensure value is a valid hex color
        const colorValue = value && /^#[0-9A-F]{6}$/i.test(value) ? value : '#000000';
        
        return `
            <div class="color-input-group">
                <label for="${id}">${label}</label>
                <div class="flex gap-1">
                    <input type="color" id="${id}" value="${colorValue}">
                    <input type="text" id="${id}_text" value="${value || ''}" placeholder="#000000" class="flex-1">
                </div>
            </div>
        `;
    }

    previewChanges() {
        const formData = this.collectFormData();
        // Convert back to the format expected by theme system
        const settings = formData.settings;
        applyThemeFromSettings(settings);
    }

    resetChanges() {
        // Convert editor format back to theme system format for preview
        const resetSettings = {
            primary_color: this.originalSettings.primary,
            secondary_color: this.originalSettings.secondary,
            background_color: this.originalSettings.background,
            surface_color: this.originalSettings.surface,
            text_color: this.originalSettings.text,
            border_color: this.originalSettings.border,
            muted_color: this.originalSettings.muted,
            error_color: this.originalSettings.error,
            success_color: this.originalSettings.success,
            font_family: this.originalSettings.font_family,
            font_size: this.originalSettings.font_size,
            radius: this.originalSettings.radius,
            spacing: this.originalSettings.spacing,
            shadow: this.originalSettings.shadow,
            custom_css: this.originalSettings.custom_css
        };
        applyThemeFromSettings(resetSettings);
        this.render();
    }

    collectFormData() {
        // Helper to get color value from either color picker or text input
        const getColorValue = (id) => {
            const textInput = document.getElementById(id + '_text');
            const colorInput = document.getElementById(id);
            
            // Prefer text input if it has a valid hex value
            if (textInput && textInput.value && /^#[0-9A-F]{6}$/i.test(textInput.value)) {
                return textInput.value;
            }
            
            // Otherwise use color picker value
            return colorInput ? colorInput.value : '#000000';
        };
        
        return {
            theme: {
                name: document.getElementById('themeName').value,
                description: document.getElementById('themeDescription').value,
                is_active: document.getElementById('themeActive').checked
            },
            settings: {
                // Core colors - map to old names for backward compatibility
                primary_color: getColorValue('primary'),
                secondary_color: getColorValue('secondary'),
                background_color: getColorValue('background'),
                surface_color: getColorValue('surface'),
                text_color: getColorValue('text'),
                border_color: getColorValue('border'),
                
                // Additional colors
                muted_color: getColorValue('muted'),
                error_color: getColorValue('error'),
                success_color: getColorValue('success'),
                
                // Typography
                font_family: document.getElementById('fontFamily').value,
                font_size: document.getElementById('fontSize').value,
                
                // Layout
                radius: document.getElementById('radius').value,
                spacing: document.getElementById('spacing').value,
                shadow: document.getElementById('shadow').value,
                
                // Custom CSS
                custom_css: document.getElementById('customCSS').value
            }
        };
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const data = this.collectFormData();
        console.log('Submitting theme data:', data);
        
        try {
            if (this.themeId) {
                // Update existing theme metadata
                const metadataResponse = await ThemesAPI.update(this.themeId, data.theme);
                
                if (!metadataResponse.success) {
                    notifications.error('Failed to update theme: ' + metadataResponse.message);
                    return;
                }
                
                // Update each setting individually
                const errors = [];
                const successCount = { value: 0 };
                
                for (const [settingKey, settingValue] of Object.entries(data.settings)) {
                    if (settingValue && settingValue.toString().trim() !== '') {
                        try {
                            const payload = {
                                key: settingKey,
                                value: settingValue.toString(),
                                type: settingKey.includes('color') ? 'color' : 'string'
                            };
                            console.log(`Sending setting ${settingKey}:`, payload);
                            
                            const response = await apiFetch(`/api/themes/${this.themeId}/settings`, {
                                method: 'POST',
                                data: payload
                            });
                            
                            if (response.success) {
                                successCount.value++;
                            } else {
                                errors.push(`${key}: ${response.message || 'Failed to update'}`);
                            }
                        } catch (err) {
                            console.error(`Failed to update setting ${key}:`, err);
                            errors.push(`${key}: ${err.message || 'Unknown error'}`);
                        }
                    }
                }
                
                if (errors.length > 0) {
                    console.error('Errors updating settings:', errors);
                    notifications.error('Theme updated with errors: ' + errors.join(', '));
                } else if (successCount.value > 0) {
                    notifications.success('Theme updated successfully!');
                    // Update original settings to reflect saved state
                    const formData = this.collectFormData();
                    this.originalSettings = {
                        primary: formData.settings.primary_color,
                        secondary: formData.settings.secondary_color,
                        background: formData.settings.background_color,
                        surface: formData.settings.surface_color,
                        text: formData.settings.text_color,
                        border: formData.settings.border_color,
                        muted: formData.settings.muted_color,
                        error: formData.settings.error_color,
                        success: formData.settings.success_color,
                        font_family: formData.settings.font_family,
                        font_size: formData.settings.font_size,
                        radius: formData.settings.radius,
                        spacing: formData.settings.spacing,
                        shadow: formData.settings.shadow,
                        custom_css: formData.settings.custom_css
                    };
                } else {
                    notifications.error('No settings were updated');
                }
            } else {
                // Create new theme - for now just create with metadata
                const response = await ThemesAPI.create(data.theme);
                
                if (response.success && response.data) {
                    // Now update settings for the new theme
                    const newThemeId = response.data.id;
                    const errors = [];
                    
                    for (const [key, value] of Object.entries(data.settings)) {
                        if (value && value.toString().trim() !== '') {
                            try {
                                const settingResponse = await apiFetch(`/api/themes/${newThemeId}/settings`, {
                                    method: 'POST',
                                    data: {
                                        key: key,
                                        value: value.toString(),
                                        type: key.includes('color') ? 'color' : 'string'
                                    }
                                });
                                
                                if (!settingResponse.success) {
                                    errors.push(`${key}: ${settingResponse.message || 'Failed to set'}`);
                                }
                            } catch (err) {
                                errors.push(`${key}: ${err.message || 'Unknown error'}`);
                            }
                        }
                    }
                    
                    if (errors.length > 0) {
                        notifications.error('Theme created with errors: ' + errors.join(', '));
                    } else {
                        notifications.success('Theme created successfully!');
                        // Update the URL to include the new theme ID
                        const newUrl = `/pages/theme-editor-page.html?id=${newThemeId}`;
                        window.history.replaceState({}, '', newUrl);
                        this.themeId = newThemeId;
                        // Update original settings to reflect saved state
                        const formData = this.collectFormData();
                        this.originalSettings = {
                            primary: formData.settings.primary_color,
                            secondary: formData.settings.secondary_color,
                            background: formData.settings.background_color,
                            surface: formData.settings.surface_color,
                            text: formData.settings.text_color,
                            border: formData.settings.border_color,
                            muted: formData.settings.muted_color,
                            error: formData.settings.error_color,
                            success: formData.settings.success_color,
                            font_family: formData.settings.font_family,
                            font_size: formData.settings.font_size,
                            radius: formData.settings.radius,
                            spacing: formData.settings.spacing,
                            shadow: formData.settings.shadow,
                            custom_css: formData.settings.custom_css
                        };
                    }
                } else {
                    notifications.error('Failed to create theme: ' + response.message);
                }
            }
        } catch (error) {
            console.error('Failed to save theme:', error);
            notifications.error('Error saving theme');
        }
    }
}