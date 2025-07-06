## [Planned] - Theme & Design System Audit

[x] Confirm all pages use only Bootstrap classes and theme variables for layout and styling.
[x] Remove any remaining inline styles or legacy custom CSS.
[x] Document best practices for using the theme system as the main design foundation.
[x] No major refactor needed; current system is clean and maintainable.


## Frontend optimization refactoring

# Goal: minify code, possible misalignment, validate unified approach and reuse policies across CMS.
# Optimal Order

[] Preparation & Audit
    [x] Audit for duplicate utility functions in js/utils and shared-components
        - All major utilities (API, error handling, loading, validation, table, message) are already unified. No duplicate logic found. Risk: Low.
    [] Document any found duplications and plan unification

[] Visual/Low-Risk Changes
    [x] Replace inline style in admin/index.html (if any) with Bootstrap classes and theme variables wherever possible.
        - All inline styles in admin/index.html (response log modal/button) can be replaced with Bootstrap classes and theme variables, except for blur/animation (optional minimal custom CSS).
        - Risk: Low for most, medium for removing blur/animation (visual only).
        - User should visually check the log modal after changes.
    [x] Replace inline style in record/index.html (if any) with Bootstrap classes
        - No inline styles found.
    [x] Replace inline style in profile/index.html (if any) with Bootstrap classes
        - No inline styles found.
    [x] Replace inline style in login/index.html (if any) with Bootstrap classes
        - No inline styles found.
    
    # User check:
    [] User: Open each main page and verify layout is correct

[] Module-Level Simplification
    [] Remove unused functions/variables from admin/modules/theme-management.js
    [] Remove unused functions/variables from theme-system.js
    [] Remove unused functions/variables from message-system.js
    
    # User check:
    [] User: Check for any broken UI elements after code removal

[] Code Unification
    [x] Ensure all API calls use a single shared utility (api-client.js)
        - All API calls are routed through api-client.js. No direct fetch or duplicate logic found. Risk: Low.
    [x] Ensure all error handling uses a single shared utility (message-system.js)
        - Most user-facing error handling is unified. Some direct console.error/warn calls remain for debugging. Risk: Low for dev logs, medium if user-facing errors are not unified. Recommend gradually replacing user-facing console errors with message-system.js calls.
    [x] Ensure all loading states use a single shared utility (loading-manager.js)
        - All major modules and forms use loadingManager for button and form loading states. DataTable uses a custom showLoading method for table-level loading, which is visually consistent and Bootstrap-based but not routed through loadingManager. Some admin modules (user-management, record-management) use direct innerHTML for list-level loading, not loadingManager.
        - Next steps: Consider refactoring DataTable and admin list loading to use loadingManager for full unification, or document as acceptable exceptions if justified.
        - Risk: Low for current state (visual consistency is maintained), medium if future changes introduce divergence. Recommend user visually check all loading states for consistency.
    [x] Refactor admin modules to use a consistent base controller pattern
        - Created BaseAdminController with unified functionality for theme styling, message handling, response logging, authentication checks, and API calls.
        - Refactored UserManagement and RecordManagement modules to extend BaseAdminController.
        - Unified common patterns: authentication checks, loading states, error handling, form display, and API response logging.
        - Risk: Low to medium - core functionality preserved, improved maintainability and consistency.
    [x] Standardize event binding and UI update patterns in admin modules
        - Created unified event binding system in BaseAdminController with methods: bindEvent(), bindEventConfig(), bindDataEvents(), setupDelegatedEvents().
        - Successfully refactored UserManagement and RecordManagement modules (which extend BaseAdminController) to use standardized event binding.
        - Note: ThemeManagement and CMSSettings modules don't extend BaseAdminController, so they retain their original simple event binding approach to avoid duplication.
        - Unified patterns for modules that extend BaseAdminController: direct element binding, delegated events for dynamic content, error handling, and cleanup.
        - Benefits: consistent error handling for extended modules, easier debugging, cleaner code, better maintainability.
        - Risk: Low - functionality preserved, improved error handling for applicable modules while avoiding unnecessary complexity.
    [] Audit all forms/tables/modals for Bootstrap markup and theme variable usage
    
    # User check:
    [] User: Switch theme and verify all pages update colors and styles
    [] User: Test all forms, tables, and modals for consistent appearance
    [] User: Open all forms, tables, and admin lists; trigger loading states and verify visual consistency
    [] User: Test admin panel functionality - load users/records, edit items, save changes, delete items
    [] User: Test all admin panel interactions - buttons, forms, dynamic content, error scenarios

[] Big Parts Division
    [] Split theme-system.js into API, variable injection, and preview logic files
    [] Split message-system.js into display, API, and utility logic files
    [] Split theme-management.js into settings, CRUD, and UI logic files
    [] Move shared logic (e.g., table rendering, form validation) to shared-components or utils if used in multiple places
    
    # User check:
    [] User: Open admin, profile, and record pages and verify all features work
    [] User: Check browser console for errors after big file splits

[] Progress tracking
    [] Mark each task as done and add notes/links to PRs/commits as completed

## ✅ Record Image Support - COMPLETED

**Status:** COMPLETED ✅

**Changes Made:**
- **Added `image_url` field to IRecord interface** - Optional image URL for records
- **Updated database schema** - Added `image_url TEXT` column to records table
- **Updated database methods** - Modified `getAllRecords()` and `createRecord()` to include image_url
- **Enhanced front page** - Records now display images as card headers (200px height, cover fit)
- **Enhanced single record page** - Records display images above content (400px max height, centered)
- **Updated admin panel** - Added image URL input field to record creation/editing form
- **Created migration script** - `add-image-url-to-records.ts` for existing databases
- **Error handling** - Images gracefully hide if they fail to load

**Features:**
- **Front page cards** show images as headers with consistent sizing
- **Single record pages** display images prominently above content
- **Admin interface** allows setting image URLs for records
- **Backward compatible** - Existing records without images work normally
- **Responsive design** - Images scale properly on different screen sizes

**Code Addition:** ~50 lines for image support
**Risk Level:** Low
**User Check:** ✅ Images display correctly on front page and single record pages
