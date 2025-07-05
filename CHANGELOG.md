# Changelog

All notable changes to this project will be documented in this file.

## [2024-12-19] - Security Implementation & Validation

### Added
- **Rate Limiting**: Global (100 req/min) and auth-specific (1 req/sec, 5 tries max) protection
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Input Sanitization**: Removes dangerous HTML tags from POST/PUT request bodies
- **Enhanced Validation**: Comprehensive user field validation aligned frontend/backend
- **Security Testing**: Automated test suite for authentication, SQL injection, XSS prevention

### Changed
- Username validation: 4-50 characters, alphanumeric/underscore/hyphen only
- Password validation: 6-100 characters with basic strength requirements
- Email validation: Standardized format checking across frontend/backend
- Profile validation: Display name (1-100 chars), bio (0-500 chars) with sanitization

### Technical
- Rate limiting excludes localhost and non-production environments
- Security headers configured to preserve theme system functionality
- Input sanitization allows theme custom CSS while blocking dangerous tags
- Frontend validation rules exactly match backend validation schemas
- Comprehensive security test coverage for critical vulnerabilities

---

## [2024-12-19] - Frontend Refactor, CMS Integration & Performance Optimization

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
- **Performance Optimization**: 19% bundle size reduction (181KB → 146KB)
- **Theme System**: 67% reduction (25KB → 8KB) with lazy loading
- **Message System**: 75% reduction (24KB → 6KB) with simplified architecture
- Code splitting and lazy loading for heavy dependencies
- Optimized CSS generation and caching strategies

---

## [Previous versions]

*Note: This changelog starts with the frontend refactor. Previous changes were not documented.* 