/**
 * Theme System Module
 * Handles dynamic theme loading and application
 */

const DEFAULT_THEME = {
  primary: '#3cff7a',
  secondary: '#444444',
  background: '#222222',
  surface: '#2a2a2a',
  text: '#e0e0e0',
  border: '#444444',
  font_family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

function generateThemeCSS(settings) {
  return `
    :root {
      --primary: ${settings.primary || DEFAULT_THEME.primary};
      --secondary: ${settings.secondary || DEFAULT_THEME.secondary};
      --background: ${settings.background || DEFAULT_THEME.background};
      --surface: ${settings.surface || DEFAULT_THEME.surface};
      --text: ${settings.text || DEFAULT_THEME.text};
      --border: ${settings.border || DEFAULT_THEME.border};
      --font-family: ${settings.font_family || DEFAULT_THEME.font_family};
    }
  `;
}

function normalizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return DEFAULT_THEME;
  
  const normalized = {};
  for (const [key, value] of Object.entries(settings)) {
    const cssKey = key.replace('_', '-');
    normalized[cssKey] = value;
  }
  return { ...DEFAULT_THEME, ...normalized };
}

async function loadThemeConfig() {
  try {
    const response = await fetch('/theme-config.json');
    if (response.ok) {
      const config = await response.json();
      if (config && Object.keys(config).length > 0) {
        return normalizeSettings(config);
      }
    }
  } catch (err) {
  }
  return DEFAULT_THEME;
}

async function fetchThemeSettings() {
  try {
    const result = await fetch('/api/themes/active');
    const data = await result.json();
    if (data.success && data.data && data.data.settings) {
      return normalizeSettings(data.data.settings);
    }
  } catch (err) {
  }
  return DEFAULT_THEME;
}

function applyTheme(settings) {
  if (!settings) settings = DEFAULT_THEME;
  
  const css = generateThemeCSS(settings);
  
  let existingStyle = document.getElementById('theme-style');
  if (existingStyle) {
    existingStyle.textContent = css;
  } else {
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = css;
    document.head.appendChild(style);
  }
}

export async function applyThemeFromConfig() {
  const config = await loadThemeConfig();
  applyTheme(config);
}

export async function applyThemeFromAPI() {
  const settings = await fetchThemeSettings();
  applyTheme(settings);
}

export function applyThemeFromSettings(settings) {
  applyTheme(settings);
}

export function getCurrentTheme() {
  const computed = getComputedStyle(document.documentElement);
  return {
    primary: computed.getPropertyValue('--primary').trim() || DEFAULT_THEME.primary,
    secondary: computed.getPropertyValue('--secondary').trim() || DEFAULT_THEME.secondary,
    background: computed.getPropertyValue('--background').trim() || DEFAULT_THEME.background,
    surface: computed.getPropertyValue('--surface').trim() || DEFAULT_THEME.surface,
    text: computed.getPropertyValue('--text').trim() || DEFAULT_THEME.text,
    border: computed.getPropertyValue('--border').trim() || DEFAULT_THEME.border,
    font_family: computed.getPropertyValue('--font-family').trim() || DEFAULT_THEME.font_family
  };
}

applyThemeFromConfig();