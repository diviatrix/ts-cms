# TypeScript CMS API Documentation

## Overview

The TypeScript CMS provides a RESTful API for content management, user authentication, theme management, and CMS settings. All endpoints return JSON responses with a consistent format.

## Base URL
```
http://localhost:7331/api
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "errors": string[] (optional)
}
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /api/register
Register a new user account.

**Request Body:**
```json
{
  "login": "username",
  "email": "user@example.com",
  "password": "password123",
  "inviteCode": "ABC123XYZ" // Optional: Required when registration_mode is "INVITE_ONLY"
}
```

**Registration Modes:**
- `OPEN`: Anyone can register without restrictions
- `INVITE_ONLY`: Registration requires a valid invite code
- `CLOSED`: Registration is disabled

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "login": "username",
    "email": "user@example.com"
  },
  "message": "User registered successfully"
}
```

**Validation Errors (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Username must be at least 4 characters", "Email format is invalid"]
}
```

**Registration Mode Errors:**
- When registration is closed (403):
```json
{
  "success": false,
  "message": "Registration is currently closed."
}
```

- When invite code is required but missing (422):
```json
{
  "success": false,
  "message": "An invite code is required to register."
}
```

- When invite code is invalid (422):
```json
{
  "success": false,
  "message": "Invalid invite code"
}
```

#### POST /api/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "login": "username",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid login credentials"
}
```

### User Profile

#### GET /api/profile
Get current user's profile (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "public_name": "Display Name",
    "profile_picture_url": "/img/avatar.png",
    "bio": "User biography",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "roles": ["user", "admin"]
  },
  "message": "Profile retrieved successfully"
}
```

#### PUT /api/profile
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "public_name": "New Display Name",
  "bio": "Updated biography"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "public_name": "New Display Name",
    "bio": "Updated biography"
  },
  "message": "Profile updated successfully"
}
```

#### POST /api/profile
Admin endpoint to update any user's profile (requires admin role).

**Request Body:**
```json
{
  "user_id": "target_user_uuid",
  "profile": {
    "public_name": "New Name",
    "bio": "New bio"
  },
  "base": {
    "email": "newemail@example.com"
  },
  "roles": ["user", "admin"]
}
```

### Records (Content Management)

#### GET /api/records
Get all records (published only for non-admin users).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Record Title",
      "description": "Record description",
      "content": "Markdown content",
      "user_id": "author_uuid",
      "public_name": "Author Name",
      "tags": ["tag1", "tag2"],
      "categories": ["category1"],
      "is_published": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Records retrieved successfully"
}
```

#### GET /api/records/:id
Get a specific record by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Record Title",
    "description": "Record description",
    "content": "Markdown content",
    "user_id": "author_uuid",
    "tags": ["tag1", "tag2"],
    "categories": ["category1"],
    "is_published": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Record retrieved successfully"
}
```

#### POST /api/records
Create a new record (requires admin role).

**Request Body:**
```json
{
  "title": "New Record",
  "description": "Record description",
  "content": "Markdown content here",
  "tags": ["tag1", "tag2"],
  "categories": ["category1"],
  "is_published": true
}
```

#### PUT /api/records/:id
Update an existing record (requires admin role).

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "tags": ["newtag"],
  "categories": ["newcategory"],
  "is_published": false
}
```

#### DELETE /api/records/:id
Delete a record (requires admin role).

**Response (204):** No content

### Themes

The theme system has two main concepts:
- **`is_active`**: Whether a theme is available for selection and writing to frontend (can be multiple)
- **`active_theme_id`** (in CMS settings): Which theme is currently set as the website's theme (legacy, optional)

#### GET /api/themes
Get all available themes.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Theme Name",
      "description": "Theme description",
      "is_active": true,
      "is_default": false,
      "created_by": "user_uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** `is_active` determines if a theme appears in the available themes list. Multiple themes can have `is_active: true`.

#### GET /api/themes/:id
Get a specific theme by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Theme Name",
    "description": "Theme description",
    "is_active": true,
    "is_default": false,
    "created_by": "user_uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/themes/:id/settings
Get theme settings.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "primary_color": "#00FF00",
    "secondary_color": "#444444",
    "background_color": "#222222",
    "surface_color": "#444444",
    "text_color": "#E0E0E0",
    "font_family": "'Share Tech Mono', monospace",
    "custom_css": ""
  }
}
```

#### POST /api/themes
Create a new theme (requires admin role).

**Request Body:**
```json
{
  "name": "New Theme",
  "description": "Theme description",
  "is_active": false,
  "settings": {
    "primary_color": "#FF0000",
    "secondary_color": "#00FF00",
    "background_color": "#000000"
  }
}
```

#### PUT /api/themes/:id
Update a theme (requires admin role).

#### DELETE /api/themes/:id
Delete a theme (requires admin role).

### CMS Settings

#### GET /api/cms/settings
Get all CMS settings (requires admin role).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "setting_key": "site_name",
      "setting_value": "My CMS",
      "setting_type": "string",
      "description": "Website name",
      "category": "general",
      "updated_at": "2024-01-01T00:00:00Z",
      "updated_by": "user_uuid"
    },
    {
      "setting_key": "registration_mode",
      "setting_value": "OPEN",
      "setting_type": "string",
      "description": "Registration mode: OPEN, CLOSED, or INVITE_ONLY",
      "category": "security",
      "updated_at": "2024-01-01T00:00:00Z",
      "updated_by": "user_uuid"
    }
  ]
}
```

#### GET /api/cms/settings/:key
Get a specific CMS setting (requires admin role).

#### PUT /api/cms/settings/:key
Update a CMS setting (requires admin role).

**Request Body:**
```json
{
  "value": "New Site Name",
  "type": "string"
}
```

#### GET /api/cms/active-theme
Get the currently active website theme (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Active Theme",
    "description": "Theme description"
  },
  "message": "Active theme retrieved successfully"
}
```

#### PUT /api/cms/active-theme
Set the active website theme (requires admin role).

**Request Body:**
```json
{
  "theme_id": "theme_uuid"
}
```

### Admin

#### Invite Management

##### POST /api/admin/invites
Create a new invite code (requires admin role).

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "invite_uuid",
    "code": "ABC123XYZ",
    "created_by": "admin_uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "used_by": null,
    "used_at": null
  },
  "message": "Invite created successfully"
}
```

##### GET /api/admin/invites
Get all invite codes with creator and user information (requires admin role).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "invite_uuid",
      "code": "ABC123XYZ",
      "created_by": "admin_uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "used_by": "user_uuid",
      "used_at": "2024-01-02T00:00:00Z",
      "creator_login": "admin_user",
      "creator_email": "admin@example.com",
      "user_login": "new_user",
      "user_email": "newuser@example.com"
    }
  ],
  "message": "Invites retrieved successfully"
}
```

##### DELETE /api/admin/invites/:id
Delete an unused invite code (requires admin role).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "message": "Invite deleted successfully"
}
```

**Error (422) - Cannot delete used invite:**
```json
{
  "success": false,
  "message": "Cannot delete used invite"
}
```

#### GET /api/admin/users
Get all users (requires admin role).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "login": "username",
      "email": "user@example.com",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

#### GET /api/profile/:id
Get a specific user's profile (requires admin role).

#### PUT /api/admin/theme/write-config
Write theme configuration to frontend (requires admin role).

**Request Body (optional):**
```json
{
  "theme_id": "theme_uuid"
}
```

If `theme_id` is not provided, the currently active theme (from CMS settings) will be used.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "primary": "#3cff7a",
    "secondary": "#444444",
    "background": "#222222",
    "surface": "#2a2a2a",
    "text": "#e0e0e0",
    "border": "#444444",
    "muted": "#aaa",
    "error": "#ff3c3c",
    "success": "#3cff7a",
    "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "font-size": "1rem",
    "radius": "1rem",
    "spacing": "0.5rem",
    "shadow": "0 4px 24px rgba(0,0,0,0.10)",
    "custom_css": ""
  },
  "message": "Theme \"Theme Name\" config written successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required. Please log in."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Field is required", "Invalid format"]
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Rate limit exceeded. Try again in 30 seconds."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to protect against abuse:

### Global Rate Limiting
- **Limit**: 100 requests per minute for all `/api` endpoints
- **Window**: 60 seconds
- **Ban Duration**: 30 seconds when exceeded

### Authentication Rate Limiting
- **Endpoints**: `/api/register` and `/api/login`
- **Limit**: 1 request per second
- **Window**: 1 second
- **Ban Duration**: Progressive (increases with repeated violations)
  - First violation: 30 seconds
  - Subsequent violations: Exponentially longer bans
- **Ban Reset**: Successful authentication resets ban count

### Rate Limit Headers
All API responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets

### Rate Limit Response
When rate limit is exceeded (429):
```json
{
  "success": false,
  "message": "Rate limit exceeded. Try again in 30 seconds."
}
```

### Notes
- Rate limiting is disabled in development/localhost environments
- Bans are tracked per IP address
- Inactive entries are automatically cleaned up
- Uses in-memory storage (consider Redis for production scaling)

## Security Notes

- JWT tokens should be stored securely on the client side
- Passwords are hashed using bcrypt
- All user inputs are validated and sanitized
- SQL injection is prevented through parameterized queries
- CORS is configured to allow requests from the specified origin
- Rate limiting protects against brute force attacks
- Progressive ban system for authentication endpoints
- Input sanitization middleware processes all requests
- Security headers middleware adds protective HTTP headers
- Invite-only registration mode for controlled access

## Database Management

### Database Consistency Check

The CMS includes a CLI command for checking and maintaining database schema integrity:

#### Check Database (Read-Only)
```bash
npx ts-node server.ts --checkdb
```

Performs a comprehensive check of the database schema without making any changes:
- **Tables Check**: Verifies all required tables exist (users, records, themes, user_groups, cms_settings, invites, theme_settings)
- **Columns Check**: Validates all required columns exist in each table
- **Exit Codes**: 
  - `0` - Database is consistent and complete
  - `1` - Missing tables or columns found, or check failed

**Example Output:**
```
Running database consistency check...

==========================================
Database Consistency Check Results:
==========================================
Tables OK: YES
Columns OK: NO
Missing Columns:
  - users.used_invite_code
  (Use --checkdb --fix to add missing columns automatically)
==========================================
```

#### Auto-Fix Database Issues
```bash
npx ts-node server.ts --checkdb --fix
```

Automatically resolves database schema issues:
- **Creates Missing Tables**: Automatically creates any missing tables with proper schema
- **Adds Missing Columns**: Adds missing columns to existing tables
- **Safe Operations**: Only adds missing components, never removes or modifies existing data
- **Exit Codes**: 
  - `0` - All issues resolved successfully
  - `1` - Failed to resolve issues or check failed

**Example Output:**
```
Running database consistency check...

Creating missing tables: invites...
Adding missing columns...
  - Adding used_invite_code to users

==========================================
Database Consistency Check Results:
==========================================
Tables OK: YES
Columns OK: YES
Database consistency check passed - all required tables and columns exist
==========================================
```

#### Use Cases
- **After Updates**: Run after updating the application to ensure new schema changes are applied
- **Development Setup**: Verify database is properly configured in development environment
- **Troubleshooting**: Diagnose database-related issues
- **Production Maintenance**: Validate database integrity in production (use read-only mode first)
- **Migration Recovery**: Fix incomplete migrations or corrupted schema

#### Schema Validation
The command validates against the complete application schema defined in `src/db-adapter/sql-schemas.ts`, including:
- User management tables (users, user_groups)
- Content management (records)
- Theme system (themes, theme_settings)  
- CMS configuration (cms_settings)
- Invitation system (invites)

## Testing

Run the automated test suite:

```bash
npm test
```

This will test all API endpoints and validate the expected responses. 

## Automated Test Coverage

The following endpoints are covered by automated tests:
- POST /api/register
- POST /api/login
- GET /api/profile
- PUT /api/profile
- POST /api/profile (self-update with profile object)
- GET /api/records
- GET /api/records/:id
- GET /api/themes
- GET /api/themes/:id
- GET /api/themes/:id/settings
- GET /api/themes/active
- GET /api/admin/users

The following endpoints are implemented but **not currently covered by automated tests**:
- POST /api/records
- PUT /api/records/:id
- DELETE /api/records/:id
- GET /api/cms/settings
- GET /api/cms/settings/:key
- PUT /api/cms/settings/:key
- PUT /api/cms/active-theme
- POST /api/admin/invites
- GET /api/admin/invites
- DELETE /api/admin/invites/:id

---

### Themes

#### GET /api/themes/active
Get the currently active website theme and its settings (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "theme": {
      "id": "uuid",
      "name": "Active Theme",
      "description": "Theme description"
    },
    "settings": {
      "primary_color": "#00FF00",
      "secondary_color": "#808080ff",
      "background_color": "#222222",
      "surface_color": "#444444",
      "text_color": "#E0E0E0",
      "font_family": "'Share Tech Mono', monospace",
      "custom_css": ""
    }
  },
  "message": "Active theme retrieved successfully"
}
```

> Note: This endpoint is tested and returns both the theme object and its settings. The previously documented `/api/cms/active-theme` endpoint may also exist, but `/api/themes/active` is the one covered by tests and should be used for retrieving the active theme.

---

### User Profile

#### POST /api/profile
Update the current user's profile (self-update) or, if admin, update any user's profile.

**Request Body (self-update):**
```json
{
  "profile": {
    "public_name": "New Name",
    "bio": "New bio",
    "profile_picture_url": "/img/avatar.png"
  }
}
```

**Request Body (admin update):**
```json
{
  "user_id": "target_user_uuid",
  "profile": {
    "public_name": "New Name",
    "bio": "New bio"
  },
  "base": {
    "email": "newemail@example.com"
  },
  "roles": ["user", "admin"]
}
```

**Note:** The self-update form is covered by automated tests. Admin update is implemented but not covered by tests.

---

### Records (Content Management)

#### POST /api/records
Create a new record (requires admin role).

#### PUT /api/records/:id
Update an existing record (requires admin role).

#### DELETE /api/records/:id
Delete a record (requires admin role).

**Note:** These endpoints are implemented but not currently covered by automated tests.

---

### CMS Settings

#### GET /api/cms/settings
#### GET /api/cms/settings/:key
#### PUT /api/cms/settings/:key
#### PUT /api/cms/active-theme

### Registration Mode Settings

The `registration_mode` CMS setting controls user registration:

- **OPEN**: Default mode, anyone can register
- **INVITE_ONLY**: Registration requires valid invite codes created by admins
- **CLOSED**: Registration is completely disabled

To change the registration mode, update the `registration_mode` setting:

```json
{
  "value": "INVITE_ONLY",
  "type": "string"
}
```

**Note:** These endpoints are implemented but not currently covered by automated tests. 