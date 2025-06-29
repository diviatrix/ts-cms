import IUser from '../types/IUser';
import database from '../db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { generateGuid } from '../utils/guid';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare';
import messages from '../data/messages';

export async function loginUser(login: string, password: string): Promise<IResolve<{ user: IUser; token: string } | undefined>> {
  try {
    if (!login || login.trim() === '') {
      return prep.response(false, messages.requirement_login);
    }

    if (!password || password.trim() === '') {
      return prep.response(false, messages.requirement_password);
    }

    const user = (await database.findUserByLogin(login)).data; 

    if (!user) {
      console.log(messages.not_found, login);
      return prep.response(false, messages.not_found)
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (passwordMatch) {
      // Exclude passwordHash from the returned user object for security
      // Delete any existing sessions for the user
      await database.deleteSessionByUserId(user.id);

      const sessionId = generateGuid();
      const userProfile = await database.getUserProfile(user.id);
      const roles = userProfile.data?.roles || [];
      const tokenResult = await generateToken({ id: user.id, sessionId: sessionId, roles: roles });
      if (!tokenResult.success || !tokenResult.data) {
        return prep.response(false, messages.failure, undefined);
      }
      const token = tokenResult.data;
      await database.saveSession(sessionId, user.id, token);

      const { password_hash, ...userWithoutPasswordHash } = user;
      return prep.response(true, messages.ok, { user: userWithoutPasswordHash as IUser, token});
    } else {
      return prep.response(false, messages.invalid_password);
    }
  } catch (error) {
    console.error('Error during login:', error);
    let errorMessage = 'An error occurred during login.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return prep.response(false, errorMessage);
  }
}