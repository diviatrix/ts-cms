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