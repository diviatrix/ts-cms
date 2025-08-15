/**
 * Theme System Module
 * Handles dynamic theme loading and application
 */

let apiClient = null;

// Default theme values that match our CSS defaults
const DEFAULT_THEME = {
  primary: '#3cff7a',
  secondary: '#444444',
  background: '#222222',
  surface: '#2a2a2a',
  text: '#e0e0e0',
  border: '#444444',
  muted: '#aaa',
  error: '#ff3c3c',
  success: '#3cff7a',
  'font-family': '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
  'font-size': '1rem',
  radius: '1rem',
  spacing: '0.5rem',
  shadow: '0 4px 24px rgba(0,0,0,0.10)',
  custom_css: ''
};

/**
 * Load theme config from local file first, fallback to API
 */
async function loadThemeConfig() {
  // Try to load local config first
  try {
    const response = await fetch('/theme-config.json');
    if (response.ok) {
      const config = await response.json();
      return config;
    }
  } catch (err) {
  }
    
  // Return null to use defaults
  return null;
}

/**
 * Fetch active theme settings from API (for preview only)
 */
async function fetchThemeSettings() {
  if (!apiClient) {
    const module = await import('../core/api-client.js');
    apiClient = module.apiFetch;
  }
    
  try {
    const result = await apiClient('/api/themes/active', { auth: false });
    if (result.success && result.data && result.data.settings) {
      return normalizeSettings(result.data.settings);
    }
  } catch (err) {
  }
    
  return null;
}

/**
 * Normalize settings to handle both object and array formats
 */
function normalizeSettings(settings) {
  if (Array.isArray(settings)) {
    const normalized = {};
    settings.forEach(s => {
      normalized[s.setting_key] = s.setting_value;
    });
    return normalized;
  }
  return settings;
}

/**
 * Map old theme property names to new ones
 */
function mapThemeProperties(settings) {
  const mapped = {};
    
  // Map old names to new names
  const propertyMap = {
    'primary_color': 'primary',
    'secondary_color': 'secondary',
    'background_color': 'background',
    'surface_color': 'surface',
    'text_color': 'text',
    'border_color': 'border',
    'muted_color': 'muted',
    'error_color': 'error',
    'success_color': 'success',
    'font_family': 'font-family',
    'font_size': 'font-size',
    'radius': 'radius',
    'spacing': 'spacing',
    'shadow': 'shadow'
  };
    
  Object.entries(settings).forEach(([key, value]) => {
    const newKey = propertyMap[key] || key;
    mapped[newKey] = value;
  });
    
  return mapped;
}

/**
 * Generate CSS custom properties from theme settings
 */
function generateThemeCSS(settings) {
  const mapped = mapThemeProperties(settings);
  const merged = { ...DEFAULT_THEME, ...mapped };
    
  let css = ':root {\n';
    
  // Apply all theme properties
  Object.entries(merged).forEach(([key, value]) => {
    if (value && key !== 'custom_css') {
      // Convert underscore to hyphen for CSS variables
      const cssKey = key.replace(/_/g, '-');
      css += `  --${cssKey}: ${value};\n`;
    }
  });
    
  css += '}\n';
    
  // Add any custom CSS
  if (merged.custom_css) {
    css += `\n${merged.custom_css}`;
  }
    
  return css;
}

/**
 * Apply theme by injecting CSS into the document
 */
function applyTheme(settings) {
  if (!settings) return;
    
  const css = generateThemeCSS(settings);
    
  // Remove any existing theme styles
  const existingStyle = document.getElementById('theme-style');
  if (existingStyle) {
    existingStyle.remove();
  }
    
  // Create and inject new theme style
  const style = document.createElement('style');
  style.id = 'theme-style';
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Public API: Apply theme from local config or defaults
 */
export async function applyThemeFromConfig() {
  const config = await loadThemeConfig();
  if (config) {
    // Config is already in the right format
    applyTheme(config);
  }
  // If no config, CSS will use default values
}

/**
 * Public API: Apply theme from API (for preview/admin only)
 */
export async function applyThemeFromAPI() {
  const settings = await fetchThemeSettings();
  if (settings) {
    applyTheme(settings);
  }
}

/**
 * Public API: Apply theme from settings object
 */
export function applyThemeFromSettings(settings) {
  applyTheme(settings);
}

/**
 * Public API: Get current theme values
 */
export function getCurrentTheme() {
  const computed = getComputedStyle(document.documentElement);
  return {
    primary: computed.getPropertyValue('--primary').trim(),
    secondary: computed.getPropertyValue('--secondary').trim(),
    background: computed.getPropertyValue('--background').trim(),
    surface: computed.getPropertyValue('--surface').trim(),
    text: computed.getPropertyValue('--text').trim(),
    border: computed.getPropertyValue('--border').trim(),
    font_family: computed.getPropertyValue('--font-family').trim()
  };
}