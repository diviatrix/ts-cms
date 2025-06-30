import database from '../db';
import logger from './logger';

/**
 * Database Transaction Management Utility
 * Provides transaction support for complex database operations
 */

export interface TransactionCallback<T> {
    (): Promise<T>;
}

export class TransactionManager {
    /**
     * Execute multiple database operations in a single transaction
     * @param callback Function containing the database operations
     * @returns Promise resolving to the callback result
     */
    static async withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
        const startTime = Date.now();
        
        try {
            logger.debug('Starting database transaction');
            
            // Begin transaction
            const beginResult = await database.beginTransaction();
            if (!beginResult.success) {
                throw new Error(`Failed to begin transaction: ${beginResult.message}`);
            }
            
            // Execute the callback with database operations
            const result = await callback();
            
            // Commit transaction
            const commitResult = await database.commitTransaction();
            if (!commitResult.success) {
                throw new Error(`Failed to commit transaction: ${commitResult.message}`);
            }
            
            const duration = Date.now() - startTime;
            logger.debug(`Transaction completed successfully`, { duration });
            
            return result;
        } catch (error) {
            // Rollback transaction on error
            try {
                const rollbackResult = await database.rollbackTransaction();
                if (rollbackResult.success) {
                    logger.warn('Transaction rolled back due to error', { error: error instanceof Error ? error.message : error });
                } else {
                    logger.error('Failed to rollback transaction', { 
                        originalError: error instanceof Error ? error.message : error,
                        rollbackError: rollbackResult.message
                    });
                }
            } catch (rollbackError) {
                logger.error('Failed to rollback transaction', { 
                    originalError: error instanceof Error ? error.message : error,
                    rollbackError: rollbackError instanceof Error ? rollbackError.message : rollbackError
                });
            }
            
            // Re-throw the original error
            throw error;
        }
    }

    /**
     * Execute a batch of operations with automatic retry logic
     * @param operations Array of operation functions
     * @param maxRetries Maximum number of retry attempts
     * @returns Promise resolving to array of results
     */
    static async withBatch<T>(operations: TransactionCallback<T>[], maxRetries: number = 3): Promise<T[]> {
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                return await this.withTransaction(async () => {
                    const results: T[] = [];
                    for (const operation of operations) {
                        results.push(await operation());
                    }
                    return results;
                });
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    logger.error(`Batch operation failed after ${maxRetries} attempts`, { error });
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                logger.warn(`Batch operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, { error });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw new Error('This should never be reached');
    }
}

/**
 * Decorator for automatic transaction wrapping
 */
export function withTransaction<T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
) {
    const originalMethod = descriptor.value;
    
    if (!originalMethod) {
        throw new Error('Method not found');
    }
    
    descriptor.value = async function(...args: T): Promise<R> {
        return await TransactionManager.withTransaction(async () => {
            return await originalMethod.apply(this, args);
        });
    };
    
    return descriptor;
}
