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
        const module = await import('../api-client.js');
        apiClient = module.AuthAPI;
        }
        try {
            const result = await apiClient.get('/cms/active-theme');
            if (result.success && result.data) {
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                return themeResult.data.settings;
            }
        }
    } catch {}
    return DEFAULT_THEME;
}

function buildThemeCSS(settings) {
        return `
            :root {
            --theme-primary-color: ${settings.primary_color || '#00FF00'};
            --theme-secondary-color: ${settings.secondary_color || '#FFD700'};
            --theme-background-color: ${settings.background_color || '#222222'};
            --theme-surface-color: ${settings.surface_color || '#444444'};
            --theme-text-color: ${settings.text_color || '#E0E0E0'};
            --theme-border-color: ${settings.border_color || '#00FF00'};
            --theme-font-family: ${settings.font_family || "'Share Tech Mono', monospace"};
        }
        body { background-color: var(--theme-background-color); color: var(--theme-text-color); font-family: var(--theme-font-family); }
        .card, .card-body, .box { background-color: var(--theme-surface-color); border-color: var(--theme-border-color); color: var(--theme-text-color); }
        .navbar { background-color: var(--theme-surface-color); }
        .btn, .btn-primary { background-color: var(--theme-primary-color); border-color: var(--theme-primary-color); color: #181a1f; }
        .btn-secondary { background-color: var(--theme-secondary-color); border-color: var(--theme-secondary-color); color: #181a1f; }
            ${settings.custom_css || ''}
        `;
    }

function applyTheme(settings) {
    const css = buildThemeCSS(settings);
    let style = document.getElementById('theme-style');
    if (style) style.remove();
    style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = css;
    document.head.appendChild(style);
}

export async function applyThemeFromAPI() {
    const settings = await fetchThemeSettings();
    applyTheme(settings);
}
