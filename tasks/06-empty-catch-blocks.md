# Fix Empty Catch Blocks

## Problem
Silent error swallowing makes debugging impossible.

## Locations
- [ ] `src/functions/themes.ts:134-136` — JSON parse error swallowed
- [ ] `src/utils/crypto.ts:72-74` — bcrypt error swallowed

## Tasks
- [ ] Add logging to catch block in `themes.ts`
- [ ] Add proper error handling or re-throw in `crypto.ts`
- [ ] Search for any other empty catch blocks: `catch\s*\([^)]*\)\s*\{\s*\}`

## Priority
**Medium** — Debuggability
