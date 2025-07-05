# Express API Positive Checks

This checklist outlines positive test cases for the public-facing API endpoints.

## General

- [ ] `GET /api`: Verify that the API root endpoint returns a successful status message.
  - **Request:** `GET /api`
  - **Expected Response:**
    ```json
    {
      "status": "ok"
    }
    ```

## Authentication

- [ ] `POST /api/register`: Test user registration with valid and unique user data.
  - **Request:** `POST /api/register` with body:
    ```json
    {
      "login": "testuser",
      "email": "test@example.com",
      "password": "password123"
    }
    ```
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {
        "id": "<user_id>",
        "login": "testuser",
        "email": "test@example.com"
      },
      "message": "User registered successfully"
    }
    ```

- [ ] `POST /api/login`: Test user login with correct credentials.
  - **Request:** `POST /api/login` with body:
    ```json
    {
      "login": "testuser",
      "password": "password123"
    }
    ```
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {
        "token": "<jwt_token>"
      },
      "message": "Login successful"
    }
    ```

## Records

- [ ] `GET /api/records`: Check that a list of published records is returned for an unauthenticated user.
  - **Request:** `GET /api/records`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "<record_id>",
          "title": "Published Record",
          "published": true
        }
      ],
      "message": "Records retrieved successfully"
    }
    ```

- [ ] `GET /api/records/:id`: Ensure that a specific published record can be retrieved by its ID without authentication.
  - **Request:** `GET /api/records/<record_id>`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {
        "id": "<record_id>",
        "title": "Published Record",
        "published": true
      },
      "message": "Record retrieved successfully"
    }
    ```

## Themes

- [ ] `GET /api/themes`: Verify that a list of all available themes is returned.
  - **Request:** `GET /api/themes`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "<theme_id>",
          "name": "Default Theme"
        }
      ]
    }
    ```

- [ ] `GET /api/themes/active`: Check that the currently active theme and its settings are returned.
  - **Request:** `GET /api/themes/active`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {
        "theme": {
          "id": "<theme_id>",
          "name": "Default Theme"
        },
        "settings": []
      }
    }
    ```

- [ ] `GET /api/themes/:id`: Ensure that a specific theme and its settings can be retrieved by its ID.
  - **Request:** `GET /api/themes/<theme_id>`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {
        "theme": {
          "id": "<theme_id>",
          "name": "Default Theme"
        },
        "settings": []
      }
    }
    ```

- [ ] `GET /api/themes/:id/settings`: Verify that the settings for a specific theme are returned correctly.
  - **Request:** `GET /api/themes/<theme_id>/settings`
  - **Expected Response:**
    ```json
    {
      "success": true,
      "data": {}
    }
    ```

## Frontend Refactor Audit - Checkpoint 1

### 1. Main Frontend Structure
- **public/index.html**: Main entry point for the front page.
- **public/script.js**: Likely a global script for the main site.
- **public/js/**: Contains shared logic, utilities, and theme-related scripts.
  - **shared-components/**: Reusable UI modules (navigation, forms, data tables, controllers).
  - **utils/**: Utility scripts, including:
    - `theme-system.js` (core theme logic, 661 lines)
    - `theme-api.js` (theme API, 164 lines)
    - Other utilities: message system, error handling, dialogs, etc.
  - **theme-init.js**: Likely initializes theme on page load.
  - **shared-components.js**: Entry point for shared components.
  - **api-client.js**: Handles API requests.
- **public/admin/**: Admin panel.
  - **modules/**: Modular scripts for admin features (user, theme, record, settings management).
  - **script.js**: Main admin script.
- **public/frontpage/**: Front page scripts.
- **public/login/**: Login page scripts, including a theme demo.
- **public/record/**, **profile/**, **password/**, **nav/**: Each has its own script.js and index.html for page-specific logic.

### 2. Theme-Related Code
- **Theme System Core:**
  - `public/js/utils/theme-system.js`: Main theme system logic.
  - `public/js/utils/theme-api.js`: Exposes theme API (theme, withTheme, themedElement, etc.).
  - `public/js/utils/index.js`: Imports and re-exports theme system and API.
- **Theme Usage:**
  - `public/login/script-theme-demo.js`: Demonstrates unified theme system (initialization, switching, theme-aware UI, event listeners for theme changes).
  - `public/include-nav.js`: Dispatches a custom event to re-apply theme styles to dynamically loaded navigation.
- **Theme Initialization:**
  - `public/js/theme-init.js`: Likely responsible for initializing the theme system on page load.
- **Admin Theme Management:**
  - `public/admin/modules/theme-management.js`: Large file (437 lines) likely handles admin-side theme management.

### 3. Responsibilities of Major Modules
- **shared-components/**: Navigation, forms, data tables, base/auth controllers.
- **utils/**: Theme system, message system, error handling, dialogs, loading, keyboard shortcuts, etc.
- **admin/modules/**: User, theme, record, and settings management for admin panel.
- **Page-specific directories**: Each (login, record, profile, password, nav) has its own script and HTML for page logic.

---

Proceeding to the next checkpoint: identifying redundancies and duplications in shared logic and theme handling.