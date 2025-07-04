import IUser from '../types/IUser';
import database from '../db';
import { hashPassword } from '../utils/password';
import { generateGuid } from '../utils/guid';
import { UserRoles } from '../data/groups';
import { ContextLogger } from '../utils/context-logger';

export async function registerUser(user: IUser): Promise<{ success: boolean; message?: string; data?: IUser }> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    if (!user.login || user.login.trim() === '') {
      ContextLogger.operation('AUTH', 'Registration', 'unknown', 'ERROR', Date.now() - startTime, 'Username required');
      resolve({ success: false, message: 'Username is required.' });
      return;
    }

    if (!user.password_hash || user.password_hash.trim() === '') {
      ContextLogger.operation('AUTH', 'Registration', user.login, 'ERROR', Date.now() - startTime, 'Password required');
      resolve({ success: false, message: 'Password is required.' });
      return;
    }

    // Basic validation examples - add more as needed
    if (user.login.length < 4) {
      ContextLogger.operation('AUTH', 'Registration', user.login, 'ERROR', Date.now() - startTime, 'Username too short');
      resolve({ success: false, message: 'Username must be at least 4 characters long.' });
      return;
    }

    // Check if this is the first real user (excluding system user)
    const userCountResult = await database.getUserCount();
    let isFirstRealUser = false;
    
    if (userCountResult.success && userCountResult.data !== undefined) {
      // If there's only 1 user (system) or 0 users, this is the first real user
      if (userCountResult.data <= 1) {
        // Double-check by looking for non-system users
        const allUsersResult = await database.getAllBaseUsers();
        if (allUsersResult.success && allUsersResult.data) {
          const realUsers = allUsersResult.data.filter(u => u.login !== 'system');
          isFirstRealUser = realUsers.length === 0;
        }
      }
    }

    // Assign a new GUID to the user ID
    // Hash the password
    const hashedPassword = await hashPassword(user.password_hash);
    user.password_hash = hashedPassword;
    user.id = generateGuid();

    const result = await database.registerUser(user); // Use the imported instance
    if (result.success) {
      // If this is the first real user, add them to the admin group
      if (isFirstRealUser) {
        const adminResult = await database.addUserToGroup(user.id, UserRoles.ADMIN);
        if (!adminResult.success) {
          console.warn('Failed to add first user to admin group:', adminResult.message);
        } else {
          ContextLogger.operation('AUTH', 'Admin assignment', user.login, 'SUCCESS', 0, 'First user granted admin role');
        }
      }
      
      ContextLogger.operation('AUTH', 'Registration', user.login, 'SUCCESS', Date.now() - startTime);
      resolve({ success: true, message: 'User registered successfully', data: result.data });
    } else {
      // Check for specific database errors and provide better messages
      let errorMessage = 'Registration failed.';
      let logResult = 'ERROR';
      
      // The error comes nested in result.data array
      const errorDetails = result.data && Array.isArray(result.data) ? result.data[0] : result.data;
      
      // Check both the detailed error and the message
      const errorText = errorDetails || result.message || '';
      
      if (typeof errorText === 'string') {
        if (errorText.includes('UNIQUE constraint failed: users.email')) {
          errorMessage = 'This email address is already registered.';
          logResult = 'DUPLICATE_EMAIL';
        } else if (errorText.includes('UNIQUE constraint failed: users.login')) {
          errorMessage = 'This username is already taken.';
          logResult = 'DUPLICATE_LOGIN';
        } else if (result.message) {
          errorMessage = result.message;
        }
      } else {
        errorMessage = result.message || 'Registration failed.';
      }
      
      ContextLogger.operation('AUTH', 'Registration', user.login, logResult, Date.now() - startTime, errorMessage);
      resolve({ success: false, message: errorMessage });
    }
  });
}