#!/usr/bin/env node

/**
 * Migration Runner Script
 * Runs the migration to add image_url column to records table
 */

const { addImageUrlToRecords } = require('./dist/migrations/add-image-url-to-records.js');

async function runMigration() {
    try {
        console.log('Starting migration process...');
        await addImageUrlToRecords();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration(); 