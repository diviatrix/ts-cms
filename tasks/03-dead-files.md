# Remove Dead Code and Junk Files

## Problem
Unused files, compiled JS in src/, empty placeholders cluttering the repo.

## Files to delete
- [ ] `src/db.ts.imports.tmp` — leftover temp file
- [ ] `src/middleware/validation.middleware.js` — compiled JS in src/
- [ ] `src/constants/validation-schemas.js` — compiled JS in src/
- [ ] `src/utils/validation-utils.js` — compiled JS in src/
- [ ] `src/utils/response.utils.js` — compiled JS in src/
- [ ] `src/utils/constants.js` — compiled JS in src/
- [ ] `src/constants/http-status.js` — compiled JS in src/

## Files to investigate and remove if unused
- [ ] `src/database.ts` — empty placeholder class (10 lines)
- [ ] `src/types/IUploadFile.ts` — never imported
- [ ] `src/types/IRole.ts` — never imported
- [ ] `src/data/commands.ts` — never imported

## Unused DB schemas
- [ ] Remove `stats` table from `src/db-adapter/sql-schemas.ts:25-32`
- [ ] Remove `files` table from `src/db-adapter/sql-schemas.ts:41-56`
- [ ] Remove unused `getByTableColValue()` method from `src/db-adapter/sqlite-adapter.ts:249`

## Priority
**Low** — Cleanup
