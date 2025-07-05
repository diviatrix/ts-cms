# Changelog

All notable changes to this project will be documented in this file.

## [2024-12-19] - Frontend Refactor & CMS Integration

### Added
- CMS integration system - site name/description display across all pages
- Unified message system - single `messages` API for all notifications
- Card-based admin UI - modern layouts for records, users, and themes
- Character counters and loading states for CMS settings

### Changed
- Page titles now show "Page Name - Site Name" format
- Navigation branding with site name in navbar and footer
- Admin panel redesigned with card-based layout
- All API calls standardized via `api-client.js`

### Removed
- Obsolete settings (maintenance mode, registration blocking)
- Hardcoded Bootstrap classes in favor of theme system
- Debug code and verbose console logging
- Demo files and empty scripts

### Fixed
- Edit record navigation bug
- Theme switching consistency
- Import/export module issues
- API error handling for HTTP 204 responses

### Technical
- ~40% reduction in frontend code duplication
- Modular architecture with focused utilities
- Improved SEO with proper meta tags

---

## [Previous versions]

*Note: This changelog starts with the frontend refactor. Previous changes were not documented.* 