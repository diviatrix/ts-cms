# TypeScript CMS - Development Tasks

## Current Tasks (Priority Order)

### Script Optimizations
- [x] Update password reset page to use shared components
- [x] Enhance navigation page with modern architecture  
- [x] Refactor frontpage script to use shared controllers
- [x] Consolidate remaining inline event handlers
- [x] Remove unused code and simplify utilities (saved 654 lines)
- [x] Refactor large frontend files into smaller modules (Phase 1: shared-components)
- [x] Split ui-utils.js into focused utility modules (Phase 2)
- [x] Break down admin controller into feature modules (Phase 3)

### Theming System
- [x] Prepare backend for themes - sql, api, etc
- [x] Create theme configuration interface in admin panel
- [x] Implement color customization (CSS variables)
- [x] Add Google Fonts integration
- [x] Support custom favicon and logo upload
- [x] Create footer and menu link management
- [x] Polish theming system (fix API routes, error handling, DOM issues)


### Comments System
- [ ] Add third-party integration options (Disqus)

# CMS Settings Cleanup & Improvement Plan

## Analysis Results

### ✅ **Working Functionality**
- Site name and description (backend API exists)
- Theme switching and management (backend API exists)
- Active theme setting (backend API exists)

### ❌ **Obsolete/Non-functional**
- Maintenance mode (no backend implementation)
- Registration blocking (no backend implementation)
- Theme preview (relies on non-existent global window.themeManager)

### 🔧 **Missing Implementation**
- Settings are saved but not used in frontend, but needed
- No actual maintenance mode enforcement and dont need
- No registration blocking enforcement and dont need

## Cleanup Checklist

### 1. [x] Remove Obsolete Settings
- [x] Remove maintenance mode checkbox and logic
- [x] Remove registration blocking checkbox and logic
- [x] Remove theme preview functionality (or fix if simple)
- [x] Update HTML template to remove unused form elements
- [x] Clean up JavaScript code for removed settings

### 2. [x] Improve Working Settings
- [x] **Site Name**: Make it actually display on pages (title, header, etc.)
- [x] **Site Description**: Use it for meta tags and page descriptions
- [x] **Theme Management**: Ensure theme switching works properly
- [x] Add validation for site name/description (length limits, etc.)
- [x] Add character counters and maxlength attributes
- [x] Add loading states for save/apply operations
- [x] Add proper validation with user feedback

### 4. [x] Frontend Integration
- [x] Display site name in page titles
- [x] Display site name in navigation/header
- [x] Use site description in meta tags
- [x] Create CMS integration utility module
- [x] Add integration to all main pages (frontpage, login, admin, profile, record)
- [x] Auto-refresh integration when settings are updated

### 5. [x] Code Cleanup
- [x] Remove unused CSS classes and styles (bg-secondary, bg-light from theme-controlled elements)
- [x] Clean up JavaScript event handlers (removed verbose console.log statements)
- [x] Remove unused API calls (cleaned up debug functions)
- [x] Remove obsolete demo files (message-system-demo.html, script-theme-demo.js, etc.)
- [x] Update documentation, briefly (README is current)

### 6. [ ] Testing
- [ ] User will test manually

## Implementation Priority

1. **High Priority**: Remove obsolete settings, clean up code, do not add new functionality (only to simplify old)
2. **Medium Priority**: Improve working settings, add frontend integration

## Notes

- Focus on making existing functionality work properly
- Remove features that don't have backend support
- Keep the interface clean and functional
- Ensure all remaining features work end-to-end
