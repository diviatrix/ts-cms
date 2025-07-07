# Frontend Audit Report

---

## 📄 public/js/api-client.js
- **Connected HTML:** All main pages (index.html, admin/index.html, login/index.html, profile/index.html, record/index.html, frontpage/index.html, nav/index.html)
- **HTML Issue:** JS is loaded via modules, but API usage is scattered and not always clear in HTML structure.
- **HTML Suggestion:** Document API usage per page; consider per-page API entry for clarity.
- **Issue:** File is large (527 lines), mixes API logic, error handling, and auth helpers.
- **Suggestion:** Split into smaller modules: core API, auth, error utils.
- **Required Info:** Are all API methods used? Any legacy endpoints?

---

## 📄 public/admin/script.js
- **Connected HTML:** admin/index.html
- **HTML Issue:** All admin logic is loaded in one script; HTML is large and tab content is not lazy-loaded.
- **HTML Suggestion:** Split admin HTML into smaller templates or use dynamic/lazy loading for tabs.
- **Issue:** Controller class is big, handles too many responsibilities (UI, data, events).
- **Suggestion:** Extract tab logic, event handlers, and data loading into separate modules.
- **Required Info:** Any admin features planned for removal or merge?

---

## 📄 public/js/shared-components/navigation.js
- **Connected HTML:** nav/index.html (injected into all main pages)
- **HTML Issue:** Navigation HTML is static and injected, but not all links are always relevant per user.
- **HTML Suggestion:** Consider server-side nav rendering or dynamic nav generation per user/role.
- **Issue:** Contains two unrelated components (BreadcrumbNav, UnsavedChangesDetector) in one file.
- **Suggestion:** Split into separate files per component for clarity and reuse.
- **Required Info:** Are both components always used together?

---

## 📄 public/js/utils/theme-system.js
- **Connected HTML:** All main pages (index.html, admin/index.html, login/index.html, profile/index.html, record/index.html, frontpage/index.html)
- **HTML Issue:** Theme system is initialized on every page, but theme controls are only in admin.
- **HTML Suggestion:** Add theme switcher UI to user-facing pages if user customization is desired.
- **Issue:** File is long (365 lines), mixes theme loading, caching, CSS generation.
- **Suggestion:** Separate theme API, cache, and CSS logic into modules.
- **Required Info:** Any plans for more theme features or just maintenance?

---

## 📄 public/admin/modules/theme-management.js
- **Connected HTML:** admin/index.html (themes tab)
- **HTML Issue:** Theme management UI is embedded in a large tab-pane; not modular.
- **HTML Suggestion:** Extract theme management to a separate HTML partial or page for maintainability.
- **Issue:** File is very large (528 lines), mixes UI, API, and logic for all theme actions.
- **Suggestion:** Split into: theme list, theme form, API, and dialog helpers.
- **Required Info:** Any theme features unused or deprecated?

---

## 📄 public/admin/modules/record-management.js
- **Connected HTML:** admin/index.html (records tab)
- **HTML Issue:** Record management UI is embedded in a large tab-pane; not modular.
- **HTML Suggestion:** Extract record management to a separate HTML partial or page for maintainability.
- **Issue:** Handles UI, API, and event logic in one class; some duplication with user-management.
- **Suggestion:** Extract CRUD logic, event binding, and UI rendering into separate modules.
- **Required Info:** Any record types or features planned for removal?

---

## 📄 public/admin/modules/user-management.js
- **Connected HTML:** admin/index.html (users tab)
- **HTML Issue:** User management UI is embedded in a large tab-pane; not modular.
- **HTML Suggestion:** Extract user management to a separate HTML partial or page for maintainability.
- **Issue:** Similar structure to record-management; mixes UI, API, and event logic.
- **Suggestion:** Reuse shared logic/components for CRUD, extract UI rendering.
- **Required Info:** Any user roles or features not needed anymore?

---

## 📄 public/admin/modules/cms-settings.js
- **Connected HTML:** admin/index.html (cms-settings tab)
- **HTML Issue:** CMS settings UI is embedded in a large tab-pane; not modular.
- **HTML Suggestion:** Extract CMS settings to a separate HTML partial or page for maintainability.
- **Issue:** Large file (434 lines), mixes settings, theme, and download logic.
- **Suggestion:** Split into: settings form, theme selector, download/export logic.
- **Required Info:** Any settings planned to be removed or merged?

---

## 📄 public/js/shared-components/form-handler.js
- **Connected HTML:** login/index.html, profile/index.html, admin/index.html (forms)
- **HTML Issue:** Form markup is duplicated across pages; validation feedback is not always consistent.
- **HTML Suggestion:** Use shared form partials/components for DRYness and consistent validation UI.
- **Issue:** Single-purpose, but could be more generic; some logic (regex, error UI) could be shared.
- **Suggestion:** Extract validation patterns and error UI helpers to utils; allow more flexible rule config.
- **Required Info:** Any forms with custom/complex validation not covered?

---

## 📄 public/js/shared-components/data-table.js
- **Connected HTML:** admin/index.html (users/records tables)
- **HTML Issue:** Table markup is generated by JS, but HTML structure is not customizable from HTML.
- **HTML Suggestion:** Allow table templates/slots for custom HTML or use web components.
- **Issue:** All table logic in one class; filter/sort/pagination tightly coupled.
- **Suggestion:** Split filter, sort, and pagination into helpers; allow custom renderers.
- **Required Info:** Any advanced table features needed (bulk actions, export)?

---

## 📄 public/js/shared-components/base-controller.js
- **Connected HTML:** All main pages (used as base for page controllers)
- **HTML Issue:** No direct HTML, but error/loading UI is not standardized in HTML.
- **HTML Suggestion:** Add standard error/loading containers in HTML for all pages.
- **Issue:** Base class is clear, but mixes error, loading, and API handling.
- **Suggestion:** Extract error/loading/API helpers to separate modules for reuse.
- **Required Info:** Any controllers not using this base?

---

## 📄 public/js/shared-components/auth-controller.js
- **Connected HTML:** login/index.html, profile/index.html, admin/index.html
- **HTML Issue:** Auth flows are handled in JS, but HTML does not always reflect auth state (e.g., disabled buttons, redirects).
- **HTML Suggestion:** Add auth state indicators and feedback in HTML for better UX.
- **Issue:** Two controllers in one file; some logic (redirect, error) could be shared.
- **Suggestion:** Split AuthPageController and ProtectedPageController; extract shared auth logic.
- **Required Info:** Any other auth flows (2FA, SSO) planned?

---

## 📄 public/js/utils/form-validation.js
- **Connected HTML:** login/index.html, profile/index.html, admin/index.html (forms)
- **HTML Issue:** Validation feedback is not always visually consistent across forms.
- **HTML Suggestion:** Standardize validation feedback markup in all forms.
- **Issue:** Good separation, but some overlap with form-handler; regex/constants could be shared globally.
- **Suggestion:** Centralize regex/constants; unify with form-handler for DRY validation.
- **Required Info:** Any validation rules unique to specific forms?

---

## 📄 public/js/utils/message-system.js
- **Connected HTML:** All main pages (global message area injected by JS)
- **HTML Issue:** Message area is injected, not present in HTML; may cause layout shift.
- **HTML Suggestion:** Add a reserved message area in HTML for consistent placement.
- **Issue:** Large, handles many message types and error categories; some logic could be reused elsewhere.
- **Suggestion:** Extract error categorization and retry logic; allow custom message renderers.
- **Required Info:** Any message types or flows not needed?

---

## 📄 public/js/utils/dialogs.js
- **Connected HTML:** admin/index.html, profile/index.html, record/index.html (modals)
- **HTML Issue:** Dialogs are injected by JS, not present in HTML; accessibility may be limited.
- **HTML Suggestion:** Add ARIA roles and ensure dialogs are accessible.
- **Issue:** Single-purpose, but tightly coupled to theme API and modal HTML.
- **Suggestion:** Decouple theme logic; allow for more dialog types (prompt, alert).
- **Required Info:** Any plans for more dialog types or custom dialogs?

---

## 📄 public/js/utils/error-handling.js
- **Connected HTML:** All main pages (error messages)
- **HTML Issue:** Error containers are not standardized in HTML.
- **HTML Suggestion:** Add standard error containers in all main HTML files.
- **Issue:** Some overlap with message-system and form-handler; retry logic and error display scattered.
- **Suggestion:** Centralize error display/retry logic; unify with message-system for consistency.
- **Required Info:** Any error flows not covered by this or message-system?

## 📄 public/js/utils/theme-api.js
- **Connected HTML:** All main pages (theme integration)
- **HTML Issue:** Theme helpers are only used in JS; HTML does not expose theme controls.
- **HTML Suggestion:** Add theme switcher or theme info in HTML if user customization is needed.
- **Issue:** Simple wrapper, but tightly coupled to theme-system; some duplicate helpers.
- **Suggestion:** Reduce coupling, centralize theme helpers, clarify API boundaries.
- **Required Info:** Any plans for more theme APIs or just maintenance?

---

## 📄 public/js/utils/auto-logout.js
- **Connected HTML:** All main pages (session management)
- **HTML Issue:** Logout warning is injected by JS, not present in HTML; may not match site style.
- **HTML Suggestion:** Add a reusable modal or warning area in HTML for session timeout.
- **Issue:** All logic in one class; warning UI is hardcoded and not customizable.
- **Suggestion:** Allow custom warning UI; extract timer logic for reuse.
- **Required Info:** Any other inactivity flows or timeouts needed?

---

## 📄 public/js/utils/loading-manager.js
- **Connected HTML:** All main pages (loading states)
- **HTML Issue:** Loading indicators are injected by JS, not present in HTML; may cause layout shift.
- **HTML Suggestion:** Add reserved loading areas or spinners in HTML for smoother UX.
- **Issue:** Simple, but only supports basic button/text loading; no global or overlay support.
- **Suggestion:** Add support for overlays/spinners; allow global loading state.
- **Required Info:** Any need for more complex loading states?

---

## 📄 public/js/utils/message-display.js
- **Connected HTML:** admin/index.html, profile/index.html, login/index.html (messageDiv, etc.)
- **HTML Issue:** Message containers are duplicated and not standardized.
- **HTML Suggestion:** Use a shared message component or partial for all pages.
- **Issue:** Utility is clear, but only supports basic alert types; not extensible for custom UIs.
- **Suggestion:** Allow custom renderers/styles; unify with message-system for consistency.
- **Required Info:** Any plans for richer message displays (toasts, banners)?

---

## 📄 public/js/utils/image-preview.js
- **Connected HTML:** profile/index.html, record/index.html (image previews)
- **HTML Issue:** Image preview containers are not standardized; may be missing on some forms.
- **HTML Suggestion:** Add a shared image preview component or partial for all forms needing previews.
- **Issue:** Very simple, but assumes parent wrapper and direct DOM manipulation.
- **Suggestion:** Add error handling for missing elements; allow for more flexible preview containers.
- **Required Info:** Any advanced preview needs (multiple images, drag-drop)?

---

## 📄 public/js/utils/cms-integration.js
- **Connected HTML:** All main pages (site name/desc, meta tags)
- **HTML Issue:** Site info is injected by JS, not always present in HTML for SEO.
- **HTML Suggestion:** Render site name/desc/meta server-side for better SEO and fallback.
- **Issue:** Handles both settings fetch and DOM update; tightly coupled to page structure.
- **Suggestion:** Decouple settings logic from DOM update; allow for custom integration points.
- **Required Info:** Any plans for dynamic CMS settings or SPA support?

---

## 📄 public/js/utils/download-utils.js
- **Connected HTML:** admin/index.html, record/index.html (download buttons)
- **HTML Issue:** Download buttons are present, but download logic is only in JS.
- **HTML Suggestion:** Add download attributes or fallback links in HTML for non-JS users.
- **Issue:** Only supports markdown; filename logic is basic.
- **Suggestion:** Add support for other file types; improve filename sanitization.
- **Required Info:** Any other download formats needed (CSV, JSON)?

---

## 📄 public/js/utils/message-api.js
- **Connected HTML:** All main pages (legacy message flows)
- **HTML Issue:** Legacy message API is still globally exposed; may cause confusion in HTML/JS usage.
- **HTML Suggestion:** Remove legacy message API from global scope in HTML/JS.
- **Issue:** Compatibility wrapper; some duplication with message-system, global exposure.
- **Suggestion:** Phase out legacy API; ensure all usage migrates to unified message system.
- **Required Info:** Any legacy flows still depending on this API?

---

➡️ _Next: Continue with other frontend files for a complete audit._ 