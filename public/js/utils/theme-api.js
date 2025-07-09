// Minimal theme API wrapper, no unifiedThemeSystem
// Remove all references to unifiedThemeSystem and only export theme, withTheme, getThemeColors

export const theme = {};
export function withTheme(callback) { callback({}); }
export function getThemeColors() { return {}; }
