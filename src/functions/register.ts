import { IUser } from '../types/IUser';
import database from '../db'; // Import the single instance
import bcrypt from 'bcryptjs';
import { generateGuid } from '../utils/guid';

export async function registerUser(user: IUser): Promise<{ success: boolean; message?: string }> {
  return new Promise(async (resolve, reject) => {
    if (!user.login || user.login.trim() === '') {
      reject(new Error('Username is required.'));
      return;
    }

    if (!user.passwordHash || user.passwordHash.trim() === '') {
      reject(new Error('Password is required.'));
      return;
    }

    // Basic validation examples - add more as needed
    if (user.login.length < 4) {
        reject(new Error('Username must be at least 4 characters long.'));
        return;
    }

    // In a real application, you would add logic here to:
    // 1. Check if the username already exists in the database.
    // 2. Hash the password.
    // 3. Save the user to the database.
    // 4. Handle potential database errors.

    // Assign a new GUID to the user ID
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.passwordHash, 10); // 10 is the number of salt rounds
    user.passwordHash = hashedPassword;
    user.id = generateGuid();

    const result = await database.registerUser(user); // Use the imported instance
    if (result !== undefined) {
      resolve(result);
    } else {
      reject(new Error('Registration failed: Database operation returned undefined.'));
    }
  });
}