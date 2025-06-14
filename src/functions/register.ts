import IUser from '../types/IUser';
import database from '../db'; // Import the single instance
import bcrypt from 'bcryptjs';
import { generateGuid } from '../utils/guid';

export async function registerUser(user: IUser): Promise<{ success: boolean; message?: string }> {
  return new Promise(async (resolve, reject) => {
    if (!user.login || user.login.trim() === '') {
      resolve({ success: false, message: 'Username is required.' });
      return;
    }

    if (!user.password_hash || user.password_hash.trim() === '') {
      resolve({ success: false, message: 'Password is required.' });
      return;
    }

    // Basic validation examples - add more as needed
    if (user.login.length < 4) {
      resolve({ success: false, message: 'Username must be at least 4 characters long.' });
      return;
    }

    // In a real application, you would add logic here to:
    // 1. Check if the username already exists in the database.
    // 2. Hash the password.
    // 3. Save the user to the database.
    // 4. Handle potential database errors.

    // Assign a new GUID to the user ID
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password_hash, 10); // 10 is the number of salt rounds
    user.password_hash = hashedPassword;
    user.id = generateGuid();

    const result = await database.registerUser(user); // Use the imported instance
    if (result.success) {
      resolve(result);
    } else {
      resolve({ success: false, message: 'Registration failed.' });
    }
  });
}