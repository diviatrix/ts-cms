import messages from '../data/messages';
import database from '../db';
import IResolve from '../types/IResolve';
import IUser from '../types/IUser';
import IUserProfile from '../types/IUserProfile';
import prep from '../utils/prepare';

export async function getAllBaseUsers(): Promise<IResolve<Array<{ base: IUser; profile: IUserProfile }> | null>> {
  try {
    const usersResult = await database.getAllBaseUsers();
    if (!usersResult.success || !usersResult.data) {
      return prep.response(false, usersResult.message, null);
    }
    const users = usersResult.data;
    const adminViewUsers: { base: IUser; profile: IUserProfile }[] = [];

    for (const user of users) {
      let profile = (await database.getUserProfile(user.id)).data;
      if (!profile) {
        await database.createUserProfile(user.id);
        profile = (await database.getUserProfile(user.id)).data;
      }
      adminViewUsers.push({ base: user, profile: profile ? profile : {} as IUserProfile });
    }
    return prep.response(true, messages.success, adminViewUsers);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}