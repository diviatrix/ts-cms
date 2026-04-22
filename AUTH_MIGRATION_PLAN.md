# Auth Migration Plan

## Overview

Replace all internal authentication with external auth service at `https://auth.hole.icu`.

---

## Part 1: Files to DELETE

### Complete Deletion (41 files)

| # | File | Reason |
|---|------|--------|
| 1 | `src/utils/jwt.ts` | JWT token handling |
| 2 | `src/utils/password.ts` | Password hashing (bcrypt) |
| 3 | `src/functions/login.ts` | Login logic |
| 4 | `src/functions/register.ts` | Registration logic |
| 5 | `src/functions/roleCheck.ts` | Role checking |
| 6 | `src/functions/user.ts` | User profile fetching |
| 7 | `src/functions/users.ts` | User management |
| 8 | `src/functions/invites.ts` | Invite management |
| 9 | `src/functions/updateProfile.ts` | Profile updates |
| 10 | `src/db-adapter/repositories/user-repo.ts` | User CRUD |
| 11 | `src/db-adapter/repositories/invite-repo.ts` | Invite CRUD |
| 12 | `src/types/IUser.ts` | User interface |
| 13 | `src/types/IUserProfile.ts` | UserProfile interface |
| 14 | `src/types/IJwtPayload.ts` | JWT payload interface |
| 15 | `src/types/IRole.ts` | Role interface |
| 16 | `src/types/IInvite.ts` | Invite interface |
| 17 | `src/data/groups.ts` | User groups config |
| 18 | `src/data/messages.ts` | User-related messages |

### Partial Deletion (code removal only)

| # | File | Remove |
|---|------|--------|
| 19 | `src/db.ts` | `user`, `invite`, `settings` repositories |
| 20 | `src/expressapi.ts` | Auth routes registration |
| 21 | `src/database.ts` | All content |
| 22 | `src/db-adapter/sqlite-adapter.ts` | User/invite table init, system user creation |
| 23 | `src/middleware/auth.middleware.ts` | All JWT logic |
| 24 | `src/routes/auth.routes.ts` | All routes |
| 25 | `src/routes/admin.routes.ts` | User management routes |
| 26 | `src/routes/profile.routes.ts` | Profile routes |

---

## Part 2: Files to MODIFY

### New Files to CREATE

| # | File | Purpose |
|---|------|---------|
| 1 | `src/auth-client.ts` | HTTP client to auth.hole.icu |
| 2 | `src/middleware/auth.middleware.ts` (NEW) | Auth service middleware |

### Files to MODIFY (detailed)

| # | File | Changes |
|---|--------|---------|
| 1 | `src/db.ts` | Remove user/invite repos, use settings for cms only |
| 2 | `src/db-adapter/sqlite-adapter.ts` | Remove users/sessions/user_groups/invites tables |
| 3 | `src/db-adapter/sql-schemas.ts` | Remove users/sessions/user_groups schema |
| 4 | `src/expressapi.ts` | Remove auth routes |
| 5 | `public/js/services/auth-manager.js` | Use auth.hole.icu API |
| 6 | `public/js/core/api-client.js` | Proxy auth requests to auth service |
| 7 | `public/js/main.js` | Update auth initialization |

---

## Part 3: Database Tables to REMOVE

| Table | Status | Notes |
|-------|--------|-------|
| `users` | DELETE | Replaced by auth service |
| `sessions` | DELETE | Replaced by auth service |
| `user_profiles` | DELETE | Use auth service user data |
| `user_groups` | DELETE | Use auth service group field |
| `invites` | DELETE | Use auth service |
| `cms_settings` | KEEP | App-specific |
| `themes` | KEEP | App-specific |
| `theme_settings` | KEEP | App-specific |
| `user_theme_preferences` | KEEP | App-specific |
| `records` | KEEP | App-specific |
| `theme_settings` | KEEP | App-specific |

---

## Part 4: Code to Remove (by file)

### `src/db.ts` - REMOVE:
```typescript
// Lines 2, 14, 22 - UserRepository import and instance
// Lines with: this.user, this.invite, this.settings
```

### `src/expressapi.ts` - REMOVE:
```typescript
// import authRoutes from './routes/auth.routes';
// app.use('/api/auth', authRoutes);
```

### `src/db-adapter/sqlite-adapter.ts` - REMOVE:
```typescript
// createUsersTable()
// createSessionsTable()
// createUserProfilesTable()
// createUserGroupsTable()
// createInvitesTable()
// ensureFirstAdmin()
// ensureSystemUser()
// cleanupTestUsers()
```

### `src/db-adapter/sql-schemas.ts` - REMOVE:
```typescript
// CREATE TABLE users
// CREATE TABLE sessions
// CREATE TABLE user_profiles
// CREATE TABLE user_groups
// CREATE TABLE invites
```

### `src/middleware/auth.middleware.ts` - REPLACE with:
```typescript
// Call auth.hole.icu/session instead of JWT
import { AuthClient } from '../auth-client';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'no session' });

  const user = await authClient.validateToken(token);
  if (!user) return res.status(401).json({ error: 'invalid token' });

  req.user = { id: user.id.toString(), login: user.username, roles: [user.group] };
  next();
}
```

---

## Part 5: API Routes Mapping

| Current Route | Handler | New Handler |
|---------------|---------|------------|
| `POST /api/auth/register` | `registerUser()` | Proxy to `auth.hole.icu/register` |
| `POST /api/auth/login` | `loginUser()` | Proxy to `auth.hole.icu/login` |
| `GET /api/auth/session` | JWT verify | Proxy to `auth.hole.icu/session` |
| `POST /api/auth/logout` | Remove session | Proxy to `auth.hole.icu/logout` |
| `POST /api/auth/change-password` | Hash password | Proxy to `auth.hole.icu/change-password` |
| `GET /api/admin/users` | Query users | Proxy to `auth.hole.icu/admin/users` |
| `DELETE /api/admin/users/:id` | Delete user | Proxy to `auth.hole.icu/admin/users/:id` |

---

## Part 6: Frontend Changes

### `public/js/services/auth-manager.js` - UPDATE:
```javascript
// Replace all localStorage/setItem calls
// Point to https://auth.hole.icu API

const AUTH_BASE = 'https://auth.hole.icu';

async login(username, password) {
  const resp = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: username, password })
  });
  const data = await resp.json();
  localStorage.setItem('session_token', data.session_token);
  return data;
}

async getSession() {
  const token = localStorage.getItem('session_token');
  const resp = await fetch(`${AUTH_BASE}/session`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return resp.json();
}

async logout() {
  const token = localStorage.getItem('session_token');
  await fetch(`${AUTH_BASE}/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  localStorage.removeItem('session_token');
}
```

---

## Part 7: Complete Deletion Checklist

```
DELETE FILES:
src/utils/jwt.ts
src/utils/password.ts
src/functions/login.ts
src/functions/register.ts
src/functions/roleCheck.ts
src/functions/user.ts
src/functions/users.ts
src/functions/invites.ts
src/functions/updateProfile.ts
src/db-adapter/repositories/user-repo.ts
src/db-adapter/repositories/invite-repo.ts
src/types/IUser.ts
src/types/IUserProfile.ts
src/types/IJwtPayload.ts
src/types/IRole.ts
src/types/IInvite.ts
src/data/groups.ts
```

---

## Part 8: Auth Service Integration Reference

### Base URL
```
https://auth.hole.icu
```

### Required Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Register | `/register` | POST |
| Login | `/login` | POST |
| Logout | `/logout` | POST |
| Get Session | `/session` | GET |
| Change Password | `/change-password` | POST |
| List Sessions | `/sessions` | GET |
| Revoke Session | `/sessions/:token` | DELETE |
| 2FA Enable | `/2fa/enable` | POST |
| 2FA Disable | `/2fa/disable` | POST |

### Request Format
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <session_token>'
}
```

### Response Format
```typescript
// Login response:
{ id: 1, username: "john", group: "user", session_token: "uuid" }

// Session response:
{ id: 1, username: "john", group: "user", must_change_password: false }
```

---

## Part 9: Migration Execution Order

1. **Create** `src/auth-client.ts` - HTTP client wrapper
2. **Create** new `src/middleware/auth.middleware.ts` - Auth service integration
3. **Modify** `src/expressapi.ts` - Remove auth routes
4. **Run** database migration - Drop user tables
5. **Modify** `public/js/services/auth-manager.js` - Use auth service
6. **Delete** all files in Part 1
7. **Run** lint
8. **Test** login/logout flow

---

## Part 10: Estimated Effort

| Phase | Files Changed | Deleted | New | Hours |
|-------|--------------|---------|-----|-------|
| 1. Auth client | 1 | 0 | 1 | 0.5 |
| 2. Middleware | 1 | 1 | 1 | 0.5 |
| 3. Routes | 3 | 3 | 0 | 1 |
| 4. Frontend | 3 | 0 | 0 | 1 |
| 5. Database | 2 | 0 | 0 | 0.5 |
| 6. Cleanup | 14 | 14 | 0 | 0.5 |
| **Total** | 24 | 18 | 2 | 4 |