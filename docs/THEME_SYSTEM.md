# Theme System Documentation

## Overview

The TypeScript CMS theme system allows administrators to create, manage, and apply visual themes to the frontend.

## Key Concepts

### Theme States

1. **Available Themes** (`is_active: true`)
   - Themes that appear in the management interface
   - Can be written to frontend configuration
   - Multiple themes can be available simultaneously

2. **Inactive Themes** (`is_active: false`)
   - Hidden from the main interface
   - Cannot be written to frontend
   - Can be reactivated by admins

### Theme Configuration

Themes are written directly to `public/theme-config.json` which contains CSS variables:

```json
{
  "primary": "#3cff7a",
  "secondary": "#444444",
  "background": "#222222",
  "surface": "#2a2a2a",
  "text": "#e0e0e0",
  "border": "#444444",
  "muted": "#aaa",
  "error": "#ff3c3c",
  "success": "#3cff7a",
  "font-family": "system-ui, sans-serif",
  "font-size": "1rem",
  "radius": "1rem",
  "spacing": "0.5rem",
  "shadow": "0 4px 24px rgba(0,0,0,0.10)",
  "custom_css": ""
}
```

## User Interface

### Theme Management Page (`/pages/themes-manage-page.html`)

- **Available Themes Section**: Shows all themes with `is_active: true`
- **Inactive Themes Section**: Shows all themes with `is_active: false`
- Each theme card displays:
  - Theme name and description
  - Preview button (temporary CSS application)
  - Write to Frontend button (saves theme to config)
  - Edit button (modify theme settings)
  - Make Active/Inactive toggle
  - Delete button (for non-default themes)

### Theme Editor (`/pages/theme-editor-page.html`)

- Create new themes or edit existing ones
- Visual color pickers for all theme variables
- Typography and layout settings
- Custom CSS field for advanced customization
- Live preview functionality

## API Endpoints

### Write Theme Configuration
```
PUT /api/admin/theme/write-config
Body (optional): { "theme_id": "uuid" }
```

If `theme_id` is provided, that specific theme is written to frontend.
If not provided, falls back to CMS settings for backward compatibility.

## Workflow

1. **Create/Edit Theme**: Use theme editor to design theme
2. **Make Available**: Set `is_active: true` to show in management
3. **Preview**: Test theme appearance without saving
4. **Write to Frontend**: Save theme configuration for live site

## Implementation Details

### Frontend
- Theme settings loaded from `theme-config.json`
- CSS variables applied to `:root` element
- Live preview uses temporary CSS injection
- No page reload required for preview

### Backend
- Themes stored in `themes` table
- Theme settings in `theme_settings` table
- Direct write to filesystem for frontend config
- No intermediate "applied" state

## Migration Notes

The system previously used a concept of "applied theme" stored in CMS settings (`active_theme_id`). This has been simplified:
- Themes are now written directly to frontend
- No intermediate state management
- `active_theme_id` retained for backward compatibility only