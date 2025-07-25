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
  "password": "password123"
}
```

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

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Security Notes

- JWT tokens should be stored securely on the client side
- Passwords are hashed using bcrypt
- All user inputs are validated and sanitized
- SQL injection is prevented through parameterized queries
- CORS is configured to allow requests from the specified origin

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

**Note:** These endpoints are implemented but not currently covered by automated tests. 