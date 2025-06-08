import { IUser } from '../types/IUser';
import Database from '../db';
import bcrypt from 'bcryptjs';

export async function loginUser(login: string, password: string): Promise<{ success: boolean; message?: string; user?: IUser }> {
  try {
    if (!login || login.trim() === '') {
      return { success: false, message: 'Login is required.' };
    }

    if (!password || password.trim() === '') {
      return { success: false, message: 'Password is required.' };
    }

    const db = Database;
    const user = await db.findUserByLogin(login); // Assuming you have a findUserByLogin method in your Database class

    if (!user) {
      return { success: false, message: 'Invalid login credentials.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      // Exclude passwordHash from the returned user object for security
      const { passwordHash, ...userWithoutPasswordHash } = user;
      return { success: true, message: 'Login successful.', user: userWithoutPasswordHash as IUser };
    } else {
      return { success: false, message: 'Invalid login credentials.' };
    }

  } catch (error) {
    console.error('Error during login:', error);
    let errorMessage = 'An error occurred during login.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}