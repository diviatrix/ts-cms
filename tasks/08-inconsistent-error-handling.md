# Standardize Error Handling

## Problem
Error handling is inconsistent across the codebase:
- Some functions use try-catch with console.error
- Some use asyncHandler wrapper
- Some throw errors directly
- Inconsistent error response formats

## Tasks
- [ ] Define standard error response format (e.g., `{ error: { code, message } }`)
- [ ] Create custom error classes (AppError, ValidationError, NotFoundError, etc.)
- [ ] Audit route handlers and pick one pattern (asyncHandler recommended)
- [ ] Ensure all thrown errors are caught by global error middleware
- [ ] Remove try-catch blocks that duplicate asyncHandler behavior
- [ ] Standardize HTTP status codes for each error type

## Files to review
- [ ] `src/routes/record.routes.ts`
- [ ] `src/routes/admin.routes.ts`
- [ ] `src/functions/*.ts`
- [ ] `src/middleware/error.middleware.ts`

## Priority
**Medium** — Maintainability, API consistency
