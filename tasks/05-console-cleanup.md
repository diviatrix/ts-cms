# Remove Debug Console.log Statements

## Problem
180+ `console.log`/`console.error` calls in production code. Should use a proper logger.

## Key locations
- [ ] `src/db.ts:24-66,80` — Mock database console.logs
- [ ] `src/db.ts:644` — `[DEBUG setCMSSetting]` debug log
- [ ] `src/db.ts:648` — debug console.error
- [ ] `src/routes/record.routes.ts:201,215,278,316`
- [ ] `src/functions/record.ts:22,26,40,56,66`
- [ ] `src/functions/user.ts:32,72,94`
- [ ] `src/functions/records.ts:18`
- [ ] `src/functions/login.ts:38,45,49,56,72` — leaks user role info
- [ ] `src/utils/prepare.ts:30,33`
- [ ] `src/utils/context-logger.ts:19,28,37` — logger itself uses console.log
- [ ] `src/middleware/error.middleware.ts:123`
- [ ] `src/db-adapter/sqlite-adapter.ts:31,59,62,95,98,106,116,146,167,177,186,212,224,226`

## Tasks
- [ ] Replace all `console.log` with logger calls
- [ ] Replace all `console.error` with logger.error calls
- [ ] Fix `context-logger.ts` to not use console.log internally
- [ ] Remove mock database debug output from `db.ts`
- [ ] Verify no sensitive data is logged (role info, password hashes)

## Priority
**Medium** — Cleanliness, security (debug info leakage)
