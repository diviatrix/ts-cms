# ts-cms

A simple, TypeScript-based Content Management System (CMS) built with Node.js, Express.js, and SQLite. Content in markdown.

## Features

-   **User Authentication**: Secure user registration, login, and profile management.
-   **Role-Based Access Control**: Differentiate user permissions, including an admin role for privileged operations.
-   **Markdown-based Records**: Create, read, update, and delete (CRUD) content records stored as Markdown.
-   **Content Publishing**: Records can be marked as published or unpublished, controlling their visibility on the frontend.
-   **Admin Panel**: A dedicated interface for administrators to manage users and all content records (published and unpublished).
-   **Dynamic Frontpage**: Displays published records with author information and excerpts, adapting its layout based on the number of records.
-   **Single Record View**: Dedicated pages for viewing full record content with Markdown rendering.
-   **SQLite Database**: Lightweight and file-based database for easy setup and portability.
-   **Frontend**: Built with plain JavaScript and Bootstrap for a responsive and functional user interface.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

Follow these steps to get the project up and running on your local machine:

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/diviatrix/ts-cms.git
    cd ts-cms
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

## Usage

To start the CMS server:

```bash
npm start
```

The server will typically run on `http://localhost:7331` (check your console for the exact address and port).

### Important Considerations

-   **Database Schema Management**: Database tables are automatically created and checked on application launch based on the schemas defined in `src/db-adapter/sql-schemas.ts`. However, there is currently no automated migration mechanism. If you modify existing table fields in the code, you might need to manually adjust your `database.db` or delete it to recreate tables on next launch.
-   **Admin Role Validation**: The `admin` role is crucial for accessing privileged sections (like the admin panel and certain API endpoints). This role validation is strictly enforced on the backend.
-   **Non-Authorized Access**: While admin-specific features are protected, certain API endpoints (e.g., fetching published records) are accessible without authentication, allowing non-authorized (anonymous) users to view public content.

### Accessing the CMS

-   **Frontpage**: Open your web browser and navigate to `http://localhost:7331`.
    -   You will see all published records. Unpublished records are not visible to anonymous users.
-   **Admin Panel**: Navigate to `http://localhost:7331/admin`.
    -   To access the admin panel, you need to log in with a user that has the `admin` role.
    -   **Setting up an Admin User**:
        1.  Register a new user through the login/register page (`http://localhost:7331/login`).
        2.  Access the database directly (e.g., using a SQLite browser) and modify the `user_profiles` table for your registered user. Set the `roles` column to `["user", "admin"]` (as a JSON string).
        3.  Alternatively, if you have an existing admin user, you can log in with them and use the admin panel's user management section to assign the `admin` role to other users.
    -   From the admin panel, you can manage users and records. Only published records are visible on the frontpage and public record pages.

### Database

The CMS uses SQLite, and the database file (`database.db`) will be created in the `data/` directory in the project root upon first startup if it doesn't already exist. Dummy user and record data are automatically inserted during the initial database setup.

## Project Structure

The frontend of this CMS is located within the `public/` directory. These static assets (HTML, CSS, JavaScript, images) are served directly by the Express.js backend.

```
. (project root)
├── public/             # Frontend static files (HTML, CSS, JS)
│   ├── admin/          # Admin panel pages and scripts
│   ├── frontpage/      # Frontpage scripts
│   ├── js/             # General frontend JavaScript utilities
│   ├── nav/            # Navigation bar components
│   └── record/         # Single record view page
├── src/                # Backend TypeScript source code
│   ├── data/           # Configuration and static data
│   ├── db-adapter/     # Database adapter and SQL schemas
│   ├── functions/      # Backend business logic functions
│   ├── types/          # TypeScript interfaces and types
│   └── utils/          # Utility functions (JWT, password hashing)
├── server.ts           # Main server entry point
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies and scripts
```

## Important Modules

This project leverages several key Node.js modules to provide its functionality:

-   **Express.js**: The web framework used to build the RESTful API and serve static frontend files.
-   **SQLite3**: The database driver for interacting with the SQLite database.
-   **bcrypt**: Used for hashing and salting user passwords to ensure secure authentication.
-   **jsonwebtoken**: For implementing JSON Web Tokens (JWTs) to handle user sessions and authentication.
-   **uuid**: Generates unique identifiers (UUIDs) for records and other entities.
-   **marked**: A Markdown parser used on the frontend to render record content.
-   **gray-matter**: (Backend) Parses front-matter from Markdown files, though currently content is stored directly in the database.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.