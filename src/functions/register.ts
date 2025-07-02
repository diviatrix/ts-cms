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
    
    console.log('🔍 Checking if first real user...');
    console.log('User count result:', userCountResult);
    
    if (userCountResult.success && userCountResult.data !== undefined) {
      console.log('Current user count:', userCountResult.data);
      // If there's only 1 user (system) or 0 users, this is the first real user
      if (userCountResult.data <= 1) {
        // Double-check by looking for non-system users
        const allUsersResult = await database.getAllBaseUsers();
        if (allUsersResult.success && allUsersResult.data) {
          const realUsers = allUsersResult.data.filter(u => u.login !== 'system');
          console.log('Real users found:', realUsers.length, realUsers.map(u => u.login));
          isFirstRealUser = realUsers.length === 0;
        }
      }
    }
    
    console.log('Is first real user?', isFirstRealUser);

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
      
      // Debug: log the entire result structure
      console.log('=== Registration Error Debug ===');
      console.log('Full result:', JSON.stringify(result, null, 2));
      console.log('result.success:', result.success);
      console.log('result.message:', result.message);
      console.log('result.data:', result.data);
      console.log('result.data type:', typeof result.data);
      console.log('result.data is array:', Array.isArray(result.data));
      
      // The error comes nested in result.data array
      const errorDetails = result.data && Array.isArray(result.data) ? result.data[0] : result.data;
      console.log('errorDetails extracted:', errorDetails);
      console.log('errorDetails type:', typeof errorDetails);
      
      // Check both the detailed error and the message
      const errorText = errorDetails || result.message || '';
      console.log('errorText to check:', errorText);
      
      if (typeof errorText === 'string') {
        if (errorText.includes('UNIQUE constraint failed: users.email')) {
          errorMessage = 'This email address is already registered.';
          logResult = 'DUPLICATE_EMAIL';
          console.log('✅ Detected duplicate email constraint');
        } else if (errorText.includes('UNIQUE constraint failed: users.login')) {
          errorMessage = 'This username is already taken.';
          logResult = 'DUPLICATE_LOGIN';
          console.log('✅ Detected duplicate login constraint');
        } else if (result.message) {
          errorMessage = result.message;
          console.log('⚠️ Using generic result.message:', result.message);
        }
      } else {
        console.log('⚠️ errorText is not a string, using result.message');
        errorMessage = result.message || 'Registration failed.';
      }
      
      console.log('Final error message:', errorMessage);
      console.log('=== End Registration Error Debug ===');
      
      ContextLogger.operation('AUTH', 'Registration', user.login, logResult, Date.now() - startTime, errorMessage);
      resolve({ success: false, message: errorMessage });
    }
  });
}