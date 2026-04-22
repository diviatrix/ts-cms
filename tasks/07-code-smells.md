# Fix Code Smells and Anti-patterns

## Issues

### Mock database in production code
- `src/db.ts:20-68` — Constructor creates mock database instead of real connection
- [ ] Remove mock DB initialization or move to test utilities

### Hardcoded first admin logic
- `src/functions/login.ts:42-51` — Hardcoded check for `'first_admin'` and `'first.admin@system.com'`
- [ ] Move to configuration or database-driven check

### Temporary no-op logger
- `src/routes/admin.routes.ts:11-15` — Fake logger object that does nothing
- [ ] Replace with real logger import

### Anti-pattern Promise usage
- `src/functions/register.ts:11` — Returns Promise but calls resolve directly
- [ ] Refactor to async/await

### Hardcoded values
- `src/constants/db-constants.ts:8` — `bio: 'Я родится'` (Russian text)
- `src/db-adapter/sqlite-adapter.ts:136` — `email: 'system@localhost'`
- `src/config/swagger.config.ts:13` — `url: 'http://localhost:7331'`
- `src/routes/record.routes.ts:238` — Hardcoded default `50` for maxSize
- [ ] Move all to config/constants

### Mixed language comments
- Russian comments in `src/db.ts` lines 339, 347, 355, 369, 378, 389, 411, 437
- [ ] Translate to English for consistency

## Priority
**Low** — Code quality
