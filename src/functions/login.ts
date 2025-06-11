import { IUser } from '../types/IUser';
import database from '../db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { generateGuid } from '../utils/guid';

export async function loginUser(login: string, password: string): Promise<{ success: boolean; message?: string; user?: IUser; token?: string }> {
  try {
    if (!login || login.trim() === '') {
      return { success: false, message: 'Login is required.' };
    }

    if (!password || password.trim() === '') {
      return { success: false, message: 'Password is required.' };
    }

    const user = await database.findUserByLogin(login); // Assuming you have a findUserByLogin method in your Database class

    if (!user) {
      return { success: false, message: 'Invalid login credentials.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      // Exclude passwordHash from the returned user object for security
      // Delete any existing sessions for the user
 await database.deleteSessionByUserId(user.id);

      const sessionId = generateGuid();
      const sessionQuery = `INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)`;
      const token = await generateToken({ id: user.id, sessionId: sessionId });
      await database.saveSession(sessionId, user.id, token);

      const { passwordHash, ...userWithoutPasswordHash } = user;
      return { success: true, message: 'Login successful.', user: userWithoutPasswordHash as IUser, token };
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