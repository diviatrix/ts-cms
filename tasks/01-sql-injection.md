# Fix SQL Injection Vulnerability

## Problem
`src/db-adapter/sqlite-adapter.ts:251` — Table and column names are interpolated directly into SQL string:

```ts
`SELECT * FROM ${table} WHERE ${col} = ?`
```

## Tasks
- [ ] Whitelist allowed table names in `getByTableColValue()`
- [ ] Whitelist allowed column names per table
- [ ] Throw error if table/column not in whitelist
- [ ] Add test for injection attempt

## Priority
**Critical** — Security vulnerability
