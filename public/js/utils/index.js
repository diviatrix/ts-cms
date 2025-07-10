import { autoLogoutManager } from './auto-logout.js';

// Import new unified theme system
import { theme, withTheme, getThemeColors } from './theme-api.js';

// Import CMS integration
import { cmsIntegration } from './cms-integration.js';

// Re-export all utilities
export {
    // New unified theme system
    theme,
    withTheme,
    getThemeColors,
    
    // Global instances
    autoLogoutManager,
    cmsIntegration
};