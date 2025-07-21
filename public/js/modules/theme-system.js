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
        apiClient = module.apiFetch;
    }
    try {
        const result = await apiClient('/api/themes/active', { auth: false });
        if (result.success && result.data && result.data.settings) {
            let settings = result.data.settings;
            if (Array.isArray(settings)) {
                const obj = {};
                for (const s of settings) {
                    obj[s.setting_key] = s.setting_value;
                }
                settings = obj;
            }
            return settings;
        }
    } catch (err) {
        console.error('[ThemeSystem] Error fetching theme settings:', err);
    }
    return null;
}

function buildThemeCSS(settings) {
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
    return css;
}

function applyTheme(settings) {
    if (!settings) {
        return;
    }
    const css = buildThemeCSS(settings);
    const existingStyles = Array.from(document.querySelectorAll('#theme-style'));
    if (existingStyles.length > 1) {
    }
    existingStyles.forEach(s => s.remove());
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = css;
    document.head.appendChild(style);
    const computedSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-secondary-color');
    const allStyles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'));
    allStyles.forEach((el, idx) => {
        if (el !== style && el.textContent && el.textContent.includes('--theme-secondary-color')) {
        }
    });
}

export async function applyThemeFromAPI() {
    const settings = await fetchThemeSettings();
    applyTheme(settings);
}
