import adapter from '../db-adapter/sqlite-adapter';

/**
 * Migration: Add image_url column to records table
 * This migration adds the image_url column to existing records tables
 */
export async function addImageUrlToRecords(): Promise<void> {
    try {
        console.log('Starting migration: Add image_url column to records table...');
        
        const db = new adapter();
        
        // Check if the column already exists
        const checkColumnQuery = `
            SELECT COUNT(*) as count 
            FROM pragma_table_info('records') 
            WHERE name = 'image_url'
        `;
        
        const checkResult = await db.executeQuery(checkColumnQuery);
        
        if (checkResult.success && checkResult.data && Array.isArray(checkResult.data)) {
            const columnExists = (checkResult.data[0] as any)?.count > 0;
            
            if (columnExists) {
                console.log('image_url column already exists, skipping migration');
                return;
            }
        }
        
        // Add the image_url column
        const addColumnQuery = `
            ALTER TABLE records 
            ADD COLUMN image_url TEXT
        `;
        
        const result = await db.executeQuery(addColumnQuery);
        
        if (result.success) {
            console.log('Successfully added image_url column to records table');
        } else {
            console.error('Failed to add image_url column:', result.message);
            throw new Error(`Migration failed: ${result.message}`);
        }
        
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    addImageUrlToRecords()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
} 