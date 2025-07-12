let apiClient = null;
const DEFAULT_THEME = {
        primary_color: '#00FF00',
        secondary_color: '#FFD700',
        background_color: '#222222',
        surface_color: '#444444',
        text_color: '#E0E0E0',
        border_color: '#00FF00',
        font_family: "'Share Tech Mono', monospace",
        custom_css: ''
};

async function fetchThemeSettings() {
    if (!apiClient) {
        const module = await import('../core/api-client.js');
        console.log('[ThemeSystem] Loaded apiClient from ../core/api-client.js');
        apiClient = module.apiFetch;
    }
    try {
        // Use the correct endpoint for active theme and settings
        const result = await apiClient('/api/themes/active');
        console.log('[ThemeSystem] Fetched /api/themes/active:', result);
        if (result.success && result.data && result.data.settings) {
            let settings = result.data.settings;
            // If settings is an array, convert to object
            if (Array.isArray(settings)) {
                const obj = {};
                for (const s of settings) {
                    obj[s.setting_key] = s.setting_value;
                }
                settings = obj;
            }
            console.log('[ThemeSystem] Using theme settings from API:', settings);
            return settings;
        }
    } catch (err) {
        console.error('[ThemeSystem] Error fetching theme settings:', err);
    }
    // No fallback! Just return null so CSS defaults are used.
    return null;
}

function buildThemeCSS(settings) {
    console.log('[ThemeSystem] Building theme CSS with settings:', settings);
    let css = ':root {';
    if (settings.primary_color) css += `--theme-primary-color: ${settings.primary_color};`;
    if (settings.secondary_color) css += `--theme-secondary-color: ${settings.secondary_color};`;
    if (settings.background_color) css += `--theme-background-color: ${settings.background_color};`;
    if (settings.surface_color) css += `--theme-surface-color: ${settings.surface_color};`;
    if (settings.text_color) css += `--theme-text-color: ${settings.text_color};`;
    if (settings.border_color) css += `--theme-border-color: ${settings.border_color};`;
    if (settings.font_family) css += `--theme-font-family: ${settings.font_family};`;
    css += '}';
    css += `\nbody { background-color: var(--theme-background-color); color: var(--theme-text-color); font-family: var(--theme-font-family); }\n.card, .card-body, .box { background-color: var(--theme-surface-color); border-color: var(--theme-border-color); color: var(--theme-text-color); }\n.navbar { background-color: var(--theme-surface-color); }\n.btn, .btn-primary { background-color: var(--theme-primary-color); border-color: var(--theme-primary-color); color: #181a1f; }\n.btn-secondary { background-color: var(--theme-secondary-color); border-color: var(--theme-secondary-color); color: #181a1f; }\n${settings.custom_css || ''}`;
    console.log('[ThemeSystem] Built theme CSS:', css);
    return css;
}

function applyTheme(settings) {
    if (!settings) {
        console.warn('[ThemeSystem] No theme settings loaded, using CSS defaults.');
        return;
    }
    console.log('[ThemeSystem] Applying theme with settings:', settings);
    const css = buildThemeCSS(settings);
    // Remove all existing theme-style elements (should only ever be one)
    const existingStyles = Array.from(document.querySelectorAll('#theme-style'));
    if (existingStyles.length > 1) {
        console.warn('[ThemeSystem] Multiple #theme-style elements found! Removing all and re-inserting.');
    }
    existingStyles.forEach(s => s.remove());
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = css;
    document.head.appendChild(style);
    console.log('[ThemeSystem] Theme applied.');
    // Log computed value of --theme-secondary-color
    const computedSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-secondary-color');
    console.log('[ThemeSystem] Computed --theme-secondary-color after apply:', computedSecondary);
    // Check for other style blocks that might override theme variables
    const allStyles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'));
    allStyles.forEach((el, idx) => {
        if (el !== style && el.textContent && el.textContent.includes('--theme-secondary-color')) {
            console.warn(`[ThemeSystem] Potential override in style block #${idx}:`, el);
        }
    });
}

export async function applyThemeFromAPI() {
    console.log('[ThemeSystem] Applying theme from API...');
    const settings = await fetchThemeSettings();
    applyTheme(settings);
    console.log('[ThemeSystem] Theme application process complete.');
}
