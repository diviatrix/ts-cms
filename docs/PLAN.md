## Static CMS Settings via JSON (No API Call for Users)

**Summary:**
- CMS settings (site name, description, etc.) are stored as a static JSON file (e.g., `/cms-settings.json`) in the frontend.
- On page load, the frontend fetches this JSON file for branding and meta info—no API call is made for users.
- When an admin updates settings in the admin panel, the backend updates both the database and the static JSON file.
- If the JSON is missing/empty, the admin panel can regenerate it from the database (admin-only logic).
- This approach eliminates 401 errors and unnecessary API calls for users, while keeping admin updates dynamic.

**Plan:**
[] 1. Refactor frontend to load settings from `/cms-settings.json` instead of API.
[] 2. On admin settings update, write new settings to both the database and `/cms-settings.json`.
[] 3. Add frontend logic to allow admin to regenerate `/cms-settings.json` from the database if missing. dont touch backend
[] 4. Remove all frontend API calls to `/api/cms/settings` for non-admins. replace with `/cms-settings.json`
[] 5. Document the workflow for updating and regenerating settings.
[] 6. Test: No API call or 401 error for users; settings update instantly after admin change.
