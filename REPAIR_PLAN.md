# Auth Service Integration Repair Plan

## Problem Analysis

The auth.hole.icu integration was partially completed but left the project in a broken state. Based on analysis, here are the main issues:

### 1. Completed Successfully ✓
- ✅ `auth-client.ts` created and works
- ✅ `auth.middleware.ts` updated to use auth service
- ✅ `auth.routes.ts` updated to proxy to auth service
- ✅ `db.ts` cleaned up (only CMS repositories remain)
- ✅ Many auth files marked for deletion (git status shows D prefix)

### 2. Broken / Incomplete ⚠️

#### Database Schema Issues:
- ❌ `sql-schemas.ts` still defines: `users`, `sessions`, `user_groups`, `user_profiles`, `invites`
- ❌ Foreign key constraints in other tables reference non-existent `users` table:
  - `records` → `users(id)` 
  - `themes` → `users(id)`
  - `files` → `users(id)`
  - `stats` → `users(id)`
  - `user_theme_preferences` → `users(id)`

#### Code Cleanup Issues:
- ❌ `sqlite-adapter.ts` still contains user table creation logic
- ❌ `sqlite-adapter.ts` still has `cleanupTestUsers()`, `ensureFirstAdminHasAdminRole()`
- ❌ `test-data-cleaner.ts` has TypeScript compilation errors
- ❌ `admin.routes.ts` still references local user management
- ❌ Various utility files reference `IUser`, `UserRepository` types

#### Database Migration Issues:
- ❌ Existing database still has user tables with data
- ❌ No migration script to drop user tables
- ❌ Foreign key constraints will break if we drop users table

---

## Repair Plan Steps

### Phase 1: Database Schema Fix (HIGHEST PRIORITY)

#### 1.1 Update Database Schema
**File:** `src/db-adapter/sql-schemas.ts`
- Remove `users`, `sessions`, `user_groups`, `user_profiles`, `invites` table definitions
- Update foreign key constraints to use `INTEGER` or remove them entirely:
  - `records`: Remove `FOREIGN KEY (user_id) REFERENCES users (id)`
  - `themes`: Remove `FOREIGN KEY (created_by) REFERENCES users (id)`  
  - `files`: Remove `FOREIGN KEY (created_by) REFERENCES users (id)`
  - `stats`: Remove `FOREIGN KEY (id) REFERENCES users (id)`
  - `user_theme_preferences`: Remove table entirely (moved to auth service)

#### 1.2 Update SQLite Adapter
**File:** `src/db-adapter/sqlite-adapter.ts`
- Remove `ensureFirstAdminHasAdminRole()` method
- Remove `cleanupTestUsers()` method
- Update `cleanupAllTestData()` to remove user table cleanup
- Update `insertDefaultTheme()` to not create system user
- Update `insertDefaultCMSSettings()` to not query users table

#### 1.3 Create Database Migration Script
Create migration script at `scripts/drop-user-tables.sql`:
```sql
-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS user_theme_preferences;
DROP TABLE IF EXISTS theme_settings;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;
```

---

### Phase 2: Code Cleanup

#### 2.1 Remove User References from Tables
**Files to update:**
- `src/db-adapter/sql-schemas.ts` (as above)
- `src/constants/db-columns.ts` - Remove user-related column definitions
- `src/constants/db-constants.ts` - Remove user-related constants
- `src/utils/database-checker.ts` - Update to check only CMS tables

#### 2.2 Fix Test Data Cleaner
**File:** `src/utils/test-data-cleaner.ts`
- Fix TypeScript errors
- Remove user-related cleanup logic
- Update to only clean CMS data (records, themes, settings)

#### 2.3 Fix Test Data Generator
**File:** `src/utils/test-data-generator.ts`
- Remove user generation logic
- Update to only generate CMS test data

#### 2.4 Update Record Routes
**File:** `src/routes/record.routes.ts`
- Remove user validation logic (rely on auth middleware)
- Use `req.user.id` from auth middleware for `user_id` field

#### 2.5 Fix Schema Parser
**File:** `src/utils/schema-parser.ts`
- Remove user table references

---

### Phase 3: Admin Routes Update

#### 3.1 Update Admin Routes
**File:** `src/routes/admin.routes.ts`
- Remove local user management endpoints (`/admin/users/*`)
- Add proxy endpoints to auth service:
  - `GET /admin/users` → Proxy to `auth.hole.icu/admin/users`
  - `GET /admin/users/:id` → Proxy to `auth.hole.icu/admin/users/:id`
  - `PUT /admin/users/:id/role` → Proxy to `auth.hole.icu/admin/users/:id/role`
  - `DELETE /admin/users/:id` → Proxy to `auth.hole.icu/admin/users/:id`

#### 3.2 Update Auth Client
**File:** `src/auth-client.ts`
- Ensure all admin endpoints are implemented:
  - `listUsers()` ✓
  - `getUser()` ✓  
  - `setUserRole()` ✓
  - `deleteUser()` ✓
  - Add `updateUser()` if needed

---

### Phase 4: Profile Routes Update

#### 4.1 Update Profile Routes  
**File:** `src/routes/profile.routes.ts`
- Remove local profile management
- Add proxy endpoints to auth service where applicable
- Consider removing entirely if auth service handles profiles

---

### Phase 5: Frontend Updates

#### 5.1 Update Frontend Auth
**File:** `public/js/services/auth-manager.js`
- Ensure it points to local proxy routes (`/api/auth/*`) not directly to auth.hole.icu
- Local routes will proxy to auth service via `auth.routes.ts`

#### 5.2 Update Admin UI
**Files in `public/js/controllers/pages/`**
- Update admin user management pages to use new API endpoints
- Remove local user CRUD logic

---

### Phase 6: Testing & Validation

#### 6.1 Fix TypeScript Compilation
```bash
npx tsc --noEmit
```
- Fix all TypeScript errors

#### 6.2 Run Database Check
```bash
npm start -- --checkdb --fix
```
- Verify database schema is clean

#### 6.3 Test Auth Flow
1. Start auth service (`http://localhost:8081`)
2. Start CMS server (`http://localhost:7331`)
3. Test registration/login/logout flow
4. Test admin functionality

---

## Database Schema Changes Required

### Tables to REMOVE:
1. `users`
2. `sessions` 
3. `user_groups`
4. `user_profiles`
5. `invites`
6. `user_theme_preferences` (moved to auth service)

### Tables to MODIFY (remove FOREIGN KEY):
1. `records` - Remove `FOREIGN KEY (user_id) REFERENCES users (id)`
2. `themes` - Remove `FOREIGN KEY (created_by) REFERENCES users (id)`
3. `files` - Remove `FOREIGN KEY (created_by) REFERENCES users (id)`
4. `stats` - Remove `FOREIGN KEY (id) REFERENCES users (id)`

### Tables to KEEP as-is:
1. `cms_settings`
2. `theme_settings`
3. `roles` (but won't be used for auth)
4. `themes` (with modified schema)

---

## Critical Notes

### Foreign Key Strategy
Option 1: Remove all foreign keys to users (recommended)
- Simplest approach
- CMS becomes independent of user IDs
- User validation happens at API level via auth middleware

Option 2: Change user_id to INTEGER referencing auth service IDs
- More complex
- Requires coordinating IDs between services
- Not recommended for initial repair

### User ID Storage
CMS tables should store `user_id` as:
- Type: `TEXT` (store auth service user ID as string)
- No foreign key constraint
- Validation via auth middleware only

### Data Migration
Existing user data will be lost! Need to:
1. Export user data if needed
2. Import into auth service
3. Update CMS records with new user IDs

---

## Execution Order

1. **Backup database** - `cp data/cms.db data/cms.db.backup`
2. **Phase 1** - Database schema updates
3. **Phase 2** - Code cleanup  
4. **Phase 3** - Admin routes update
5. **Phase 4** - Profile routes update
6. **Phase 5** - Frontend updates
7. **Phase 6** - Testing & validation
8. **Run migration** - Execute drop-user-tables.sql
9. **Final test** - Full integration test

---

## Risk Mitigation

### High Risk Areas:
1. **Data loss** - User tables dropped without migration
2. **Foreign key violations** - If dropping tables in wrong order
3. **API breaking changes** - Admin/user endpoints changed

### Mitigation:
1. Create full database backup before changes
2. Test on development database first
3. Have rollback script ready
4. Update API documentation

---

## Post-Repair Verification Checklist

- [ ] `npx tsc --noEmit` passes without errors
- [ ] `npm start -- --checkdb` shows no user tables
- [ ] Registration works (creates user in auth service)
- [ ] Login works (returns session token)
- [ ] Auth middleware validates tokens
- [ ] Admin user management works (proxied to auth service)
- [ ] Records can be created with user_id from auth
- [ ] Frontend auth flows work
- [ ] No references to `users` table in code
- [ ] Database foreign keys are clean