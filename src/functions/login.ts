import IUser from '../types/IUser';
import database from '../db';
import { verifyPassword } from '../utils/crypto';
import { generateToken } from '../utils/jwt';
import { generateGuid } from '../utils/guid';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare';
import messages from '../data/messages';
import { UserRoles } from '../data/groups';

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
      return prep.response(false, messages.not_found)
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (passwordMatch) {
      // Exclude passwordHash from the returned user object for security
      // Delete any existing sessions for the user
      await database.deleteSessionByUserId(user.id);

      const sessionId = generateGuid();
      
      // Получаем роли пользователя
      let userRolesResult = await database.getUserRoles(user.id);
      console.log('🔍 DEBUG LOGIN - Initial getUserRoles result:', userRolesResult);
      
      // ВРЕМЕННОЕ РЕШЕНИЕ: для первого admin пользователя системы
      // автоматически добавляем admin роль, если её нет
      if (user.login === 'first_admin' || user.email === 'first.admin@system.com') {
        const currentRoles = userRolesResult.data || [];
        if (!currentRoles.includes('admin')) {
          console.log('🔍 DEBUG LOGIN - Adding admin role for system admin');
          await database.addUserToGroup(user.id, 'admin');
          // Перечитываем роли после добавления
          userRolesResult = await database.getUserRoles(user.id);
          console.log('🔍 DEBUG LOGIN - Roles after adding admin:', userRolesResult);
        }
      }
      
      const roles = userRolesResult.success && userRolesResult.data && userRolesResult.data.length > 0
        ? userRolesResult.data
        : [UserRoles.USER];
      console.log('🔍 DEBUG LOGIN - Final roles used for token:', roles);
      
      const tokenResult = await generateToken({ id: user.id, sessionId: sessionId, roles: roles });
      if (!tokenResult.success || !tokenResult.data) {
        return prep.response(false, messages.failure, undefined);
      }
      const token = tokenResult.data;
      await database.saveSession(sessionId, user.id, token);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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