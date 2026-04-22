# Remove Hardcoded JWT Secret Fallback

## Problem
`src/data/config.ts:30` — Falls back to `'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION'` if env var is missing. Deployments without `JWT_SECRET` set will use an publicly known secret.

## Tasks
- [ ] Remove fallback string, throw error if `JWT_SECRET` is undefined on startup
- [ ] Update `.env.example` with `JWT_SECRET` placeholder
- [ ] Document in README that `JWT_SECRET` is required

## Priority
**Critical** — Security vulnerability
