-- Migration script to drop user tables after auth.hole.icu integration
-- Run this script when migrating from internal auth to external auth service

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS user_theme_preferences;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Verify remaining tables
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;