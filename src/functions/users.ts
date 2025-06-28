
import messages from '../data/messages';
import database from '../db';
import IResolve from '../types/IResolve';
import IUser from '../types/IUser';
import IUserProfile from '../types/IUserProfile';
import prep from '../utils/prepare';

import { getUserProfile } from './user';
  

/**
 * Fetches all users with their base data and profiles.
 * @returns A promise that resolves to an array of all users.
 */
export async function getAllBaseUsers(): Promise<IResolve<Array<{ base: IUser; profile: IUserProfile }> | null>> {
  try {
    const usersResult = await database.getAllBaseUsers();
    if (!usersResult.success || !usersResult.data) {
      return prep.response(false, usersResult.message, null);
    }

    const users = usersResult.data;
    const adminViewUsers: { base: IUser; profile: IUserProfile }[] = [];

    for (const user of users) {
      const profileResult = await getUserProfile(user.id);
      if (profileResult.success && profileResult.data) {
        adminViewUsers.push({ base: user, profile: profileResult.data });
      } else {
        // Log the error but continue processing other users
        console.error(`Could not fetch profile for user ${user.id}: ${profileResult.message}`);
      }
    }

    return prep.response(true, messages.success, adminViewUsers);
  } catch (error) {
    console.error('Error in getAllBaseUsers:', error);
    // Use a more specific error message if possible
    return prep.response(false, messages.users_fetch_error, null);
  }
}
