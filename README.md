![TypeScript Lightweight CMS](public/img/promo/index.png)

# ts-cms

A simple, TypeScript-based Content Management System built with Node.js, Express.js, and SQLite.

## Features

- User authentication with JWT and role-based access control
- Content is stored as "records" in SQL, save and read by frontend as markdown strings.
- Frontend is served directly by backend, so you don't need an extra express server if you keep frontend simple.
- Admin panel for user and content management
- Dynamic frontpage displaying published content
- SQLite database with automatic schema creation
- Bootstrap frontend with simple responsive design (works on mobile too)


## Quick Start

1. **Install Node.js** (LTS version recommended)

2. **Clone and install**:
   ```bash
   git clone https://github.com/diviatrix/ts-cms.git
   cd ts-cms
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Access the CMS**:
   - Frontpage: `http://localhost:7331`
   - Login/Register: `http://localhost:7331/login`
   - Admin Panel: `http://localhost:7331/admin` (admin role required)

## Admin Setup

Register a user, then manually add admin role to the SQLite database:
```sql
INSERT INTO user_groups (user_id, group_id) VALUES ('YOUR_USER_ID', 'admin');
```

## Development

- [PLAN.md](PLAN.md) - Current and future development tasks
- [CHANGELOG.md](CHANGELOG.md) - Completed work history

SQLite database (`database.db`) is created automatically in the `data/` directory.

## Contributing

Contributions welcome! Please submit a Pull Request.

## License

This project is licensed under [LICENSE](LICENSE).
