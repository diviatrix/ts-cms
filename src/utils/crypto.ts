/**
 * Modern crypto utilities using Node.js built-in crypto module
 * Replaces bcrypt with native scrypt for better performance and no dependencies
 */

import { randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Configuration for scrypt
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
// Unused configuration constants - kept for future use
// const SCRYPT_COST = 16384; // N parameter (must be power of 2)
// const SCRYPT_BLOCK_SIZE = 8; // r parameter
// const SCRYPT_PARALLELIZATION = 1; // p parameter

/**
 * Hash a password using scrypt
 * Format: salt:hash (both base64 encoded)
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await scryptAsync(
        password, 
        salt, 
        KEY_LENGTH
    ) as Buffer;
    
    return `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        const [saltBase64, hashBase64] = hash.split(':');
        if (!saltBase64 || !hashBase64) {
            // Might be old bcrypt hash, try fallback
            return fallbackBcryptVerify(password, hash);
        }
        
        const salt = Buffer.from(saltBase64, 'base64');
        const storedHash = Buffer.from(hashBase64, 'base64');
        
        const derivedKey = await scryptAsync(
            password,
            salt,
            KEY_LENGTH
        ) as Buffer;
        
        return timingSafeEqual(storedHash, derivedKey);
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

/**
 * Fallback for old bcrypt hashes during migration period
 * This allows existing users to still login
 */
async function fallbackBcryptVerify(password: string, hash: string): Promise<boolean> {
    try {
        // Only use bcrypt if it's available (for migration period)
        const bcrypt = await import('bcryptjs').catch(() => null);
        if (bcrypt && hash.startsWith('$2')) { // bcrypt hashes start with $2
            return bcrypt.compare(password, hash);
        }
    } catch {
        // Bcrypt not available or comparison failed
    }
    return false;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('base64url');
}

/**
 * Generate a secure random code (for invites, etc)
 */
export function generateSecureCode(length: number = 9): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomValues = randomBytes(length);
    let code = '';
    
    for (let i = 0; i < length; i++) {
        code += chars[randomValues[i] % chars.length];
    }
    
    return code;
}

/**
 * Hash data for integrity checks (not for passwords!)
 */
export function hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    
    return timingSafeEqual(bufferA, bufferB);
}