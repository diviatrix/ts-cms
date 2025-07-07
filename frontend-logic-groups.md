# Frontend Logic Groups

---

## 1️⃣ Authentication Flow
- **UI:**
  - login/index.html
  - public/js/shared-components/auth-controller.js
- **API:**
  - public/js/api-client.js (AuthAPI)
- **Utils:**
  - public/js/utils/form-validation.js
  - public/js/utils/message-system.js
  - public/js/utils/message-api.js
  - public/js/utils/error-handling.js

---

## 2️⃣ Profile Management
- **UI:**
  - profile/index.html
  - public/js/shared-components/form-handler.js
  - public/js/utils/image-preview.js
- **API:**
  - public/js/api-client.js (ProfileAPI)
- **Utils:**
  - public/js/utils/form-validation.js
  - public/js/utils/message-system.js
  - public/js/utils/message-api.js
  - public/js/utils/error-handling.js

---

## 3️⃣ Admin Panel
- **UI:**
  - admin/index.html
  - public/admin/script.js
  - public/admin/modules/user-management.js
  - public/admin/modules/record-management.js
  - public/admin/modules/theme-management.js
  - public/admin/modules/cms-settings.js
  - public/js/shared-components/data-table.js
- **API:**
  - public/js/api-client.js (AdminAPI, RecordsAPI, ThemeAPI)
- **Utils:**
  - public/js/utils/message-system.js
  - public/js/utils/message-api.js
  - public/js/utils/dialogs.js
  - public/js/utils/download-utils.js
  - public/js/utils/form-validation.js
  - public/js/utils/error-handling.js

---

## 4️⃣ Record Browsing & Editing
- **UI:**
  - frontpage/index.html
  - record/index.html
  - public/frontpage/script.js
  - public/record/script.js
- **API:**
  - public/js/api-client.js (RecordsAPI)
- **Utils:**
  - public/js/utils/message-system.js
  - public/js/utils/message-api.js
  - public/js/utils/image-preview.js
  - public/js/utils/download-utils.js

---

## 5️⃣ Theme & Appearance
- **UI:**
  - admin/index.html (themes tab)
  - public/js/theme-init.js
- **API:**
  - public/js/utils/theme-system.js
  - public/js/utils/theme-api.js
- **Utils:**
  - public/js/utils/theme-system.js
  - public/js/utils/theme-api.js

---

## 6️⃣ Navigation & Layout
- **UI:**
  - nav/index.html
  - public/include-nav.js
  - public/nav/script.js
  - public/js/shared-components/navigation.js
- **Utils:**
  - public/js/utils/cms-integration.js (site name/desc)

---

## 7️⃣ Shared Utilities
- **Messaging:**
  - public/js/utils/message-system.js
  - public/js/utils/message-api.js
  - public/js/utils/message-display.js
- **Loading:**
  - public/js/utils/loading-manager.js
- **Session:**
  - public/js/utils/auto-logout.js
- **Dialogs:**
  - public/js/utils/dialogs.js
- **Validation:**
  - public/js/utils/form-validation.js
- **Error Handling:**
  - public/js/utils/error-handling.js
- **CMS Integration:**
  - public/js/utils/cms-integration.js

---

➡️ _Each group above lists the main files powering that user flow or feature, with shared utilities noted where used._ 