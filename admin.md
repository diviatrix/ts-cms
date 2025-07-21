# Admin Panel Implementation Plan

## Current Issue
Admin panel controller and all tab components were deleted during cleanup

## Simplified Approach

### 1. Create Simple Admin Controller
- Single file: admin-panel-controller.js
- Export default class like other page controllers
- No complex tab system

### 2. Admin Panel Structure
- Use card-grid layout (like profile page)
- Simple cards with direct functionality:
  - Users list with inline actions
  - Records list with add/edit/delete
  - Themes list with activate button
  - Settings key-value editor

### 3. Implementation
- Each section is a method that renders HTML
- Use fetch directly with AdminAPI, RecordsAPI, ThemesAPI
- Inline forms for editing (no modals/tabs)
- Simple event delegation for actions

### 4. Follow RULES.md
- No hardcoded styles
- Use existing CSS classes
- Keep it dead simple
- Direct API calls, no abstractions

### 5. Layout
```
<h2>Admin Panel</h2>
<div class="card-grid">
  <div class="card">Users...</div>
  <div class="card">Records...</div>
  <div class="card">Themes...</div>
  <div class="card">Settings...</div>
</div>
```