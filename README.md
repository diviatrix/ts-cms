![TypeScript Lightweight CMS](public/img/promo/index.png)

# TypeScript CMS

A lightweight, TypeScript-based Content Management System built with Node.js, Express.js, and SQLite. Features secure user authentication, markdown content management, and a clean, responsive interface.

## Features

### Core Functionality
- **Content Management**: Store and manage content as markdown with full syntax highlighting
- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access**: Admin and user roles with granular permissions
- **Responsive Design**: Bootstrap-based UI that works on desktop and mobile
- **SQLite Database**: Lightweight database with automatic schema creation and migrations

### Security & Performance
- **Rate Limiting**: Global (100 req/min) and auth-specific (1 req/sec) rate limiting with progressive ban system
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Security Headers**: CORS, security headers, and JWT token management
- **Optimized Performance**: Modular CSS architecture without animations for smooth scrolling

### Advanced Features
- **Swagger API Documentation**: Interactive API docs at `/api-docs` (configurable via admin)
- **Invite System**: Three registration modes - OPEN, INVITE_ONLY, or CLOSED
- **Markdown Rendering**: Full markdown support with syntax highlighting using marked.js and highlight.js
- **Theme System**: Dynamic theme management with CSS variable system
- **Admin Panel**: Complete user and content management interface


## Quick Start

### Prerequisites
- **Node.js** (LTS version 16+ recommended)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/diviatrix/ts-cms.git
   cd ts-cms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-reload)
   npm run dev
   ```

4. **Access the application**:
   - **Homepage**: `http://localhost:7331`
   - **Login/Register**: `http://localhost:7331/login`
   - **Admin Panel**: `http://localhost:7331/admin` (requires admin role)
   - **API Documentation**: `http://localhost:7331/api-docs` (when enabled)

### First-Time Setup

1. **Register your first user** at `http://localhost:7331/login`
2. **Promote to admin** by running this SQL command:
   ```sql
   INSERT INTO user_groups (user_id, group_id) VALUES ('YOUR_USER_ID', 'admin');
   ```
3. **Configure registration mode** in Admin Panel > Settings (OPEN/INVITE_ONLY/CLOSED)

## Configuration

### Environment Variables

```bash
# Server Configuration
API_PORT=7331                    # Server port (default: 7331)
CORS_ORIGIN=http://localhost:7331 # CORS origin (default: http://localhost:7331)
NODE_ENV=production              # Environment mode

# Database
# SQLite database is automatically created at ./data/database.db
```

### Registration Modes

Configure user registration through Admin Panel > Settings:

- **OPEN**: Anyone can register freely
- **INVITE_ONLY**: Users need a valid invite code
- **CLOSED**: Registration is completely disabled

### API Documentation

Swagger UI can be enabled/disabled through Admin Panel > Settings:
- Access at `/api-docs` when enabled
- Disabled by default in production for security
- Provides interactive API testing and documentation

## Development

### Available Scripts

```bash
npm start         # Start production server (ts-node)
npm run dev       # Start development server with auto-reload (nodemon)
npm run lint      # Run ESLint on TypeScript and JavaScript files
npm test          # Run test suite with Mocha
```

### Project Structure

```
ts-cms/
├── src/                    # Backend TypeScript source
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── config/           # Configuration files
│   ├── functions/        # Business logic functions
│   └── migrations/       # Database migrations
├── public/                # Frontend assets
│   ├── js/               # Frontend JavaScript (vanilla)
│   ├── css/              # Modular CSS architecture
│   └── partials/         # HTML partial templates
├── tests/                 # Test files
└── data/                 # SQLite database location
```

### CSS Architecture

Modular CSS system for maintainability:
- `base.css` - Reset and base styles
- `components.css` - Reusable component styles
- `layout.css` - Layout and grid systems
- `dropdowns.css` - Dropdown-specific styles
- `utilities.css` - Utility classes
- `design-system.css` - CSS variables and theme system

### Database

- **SQLite database** automatically created at `./data/database.db`
- **Migrations** run automatically on server start
- **Backup recommended** for production deployments

### Rate Limiting

- **Global**: 100 requests per minute for all API endpoints
- **Authentication**: 1 request per second with progressive ban system
- **Bypass**: Automatically disabled for localhost/development

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/auth.test.ts
```

### Documentation

- **API Documentation**: Available at `/api-docs` (when enabled)
- **Development Notes**: See [PLAN.md](PLAN.md) for roadmap
- **Changes**: Track updates in [CHANGELOG.md](CHANGELOG.md)

## API Overview

The CMS provides a RESTful API with the following main endpoints:

### Authentication
- `POST /api/register` - User registration (respects registration mode)
- `POST /api/login` - User login with JWT token
- `POST /api/logout` - User logout

### Content Management
- `GET /api/records` - List published records with filtering
- `POST /api/records` - Create new record (authenticated)
- `GET /api/records/:id` - Get single record
- `PUT /api/records/:id` - Update record (owner/admin only)
- `DELETE /api/records/:id` - Delete record (owner/admin only)

### User Management
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/users` - List users (admin only)
- `POST /api/users/:id/role` - Manage user roles (admin only)

### System Management
- `GET /api/themes` - List available themes
- `POST /api/themes/:id/apply` - Apply theme (admin only)
- `GET /api/cms/settings` - Get CMS configuration
- `PUT /api/cms/settings` - Update CMS settings (admin only)

### Invite System
- `POST /api/invites` - Create invite code (admin only)
- `GET /api/invites` - List invites (admin only)
- `DELETE /api/invites/:id` - Revoke invite (admin only)

All API endpoints return JSON responses with consistent structure:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Production Checklist

1. **Environment Setup**:
   ```bash
   export NODE_ENV=production
   export API_PORT=7331
   export CORS_ORIGIN=https://yourdomain.com
   ```

2. **Security Configuration**:
   - Set registration mode to INVITE_ONLY or CLOSED
   - Disable Swagger API docs in production
   - Configure proper CORS origin
   - Set up reverse proxy (nginx recommended)

3. **Database Backup**:
   ```bash
   # Backup SQLite database
   cp data/database.db data/database.backup.db
   ```

4. **Process Management**:
   ```bash
   # Using PM2 (recommended)
   npm install -g pm2
   pm2 start server.ts --name "ts-cms"
   pm2 save
   pm2 startup
   ```

### Docker Support

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 7331
CMD ["npm", "start"]
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the code style** - run `npm run lint` before committing
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with clear description

### Development Setup

```bash
git clone https://github.com/diviatrix/ts-cms.git
cd ts-cms
npm install
npm run dev
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check `/api-docs` for API reference
- **Community**: Contributions and feedback welcome
