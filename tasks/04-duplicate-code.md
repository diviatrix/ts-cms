# Fix Duplicate Code

## Problem
Copy-pasted logic and redundant definitions across the codebase.

## Issues

### Duplicate TABLE_COLUMNS definitions
- `src/constants/db-constants.ts:14-25`
- `src/constants/db-columns.ts:1-11`
- Columns for `cms_settings` differ between files (missing `type`, `category`, `updated_by`, `updated_at` in db-constants.ts)

### Tasks
- [ ] Consolidate into a single source of truth
- [ ] Update all imports to use the canonical definition
- [ ] Remove the redundant file

### Repeated record JSON parsing
- `src/db.ts:284-291`
- `src/db.ts:412-418`
- `src/db.ts:456-462`

### Tasks
- [ ] Extract into a shared `parseRecordFields()` helper
- [ ] Replace all 3 occurrences

### Pointless conditional
- `src/db.ts:301-310` — All branches return `${field} = ?`

### Tasks
- [ ] Simplify to direct return

## Priority
**Medium** — Maintainability
