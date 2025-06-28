import messages from '../data/messages';
import database from '../db';
import IResolve from '../types/IResolve';
import IUser from '../types/IUser';
import IUserProfile from '../types/IUserProfile';
import prep from '../utils/prepare';
import { hashPassword } from '../utils/password';

/**
 * Fetches a user's profile, creating one if it doesn't exist.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the user's profile.
 */
export async function getUserProfile(userId: string): Promise<IResolve<IUserProfile | undefined>> {
  try {
    let profileResult = await database.getUserProfile(userId);

    // If profile doesn't exist, create it
    if (!profileResult.success || !profileResult.data) {
      const creationResult = await database.createUserProfile(userId);
      if (creationResult.success) {
        // Fetch the newly created profile
        profileResult = await database.getUserProfile(userId);
      } else {
        // Return the creation error
        return prep.response(false, creationResult.message, undefined);
      }
    }
    
    return profileResult;
  } catch (error) {
    console.error(`Error in getUserProfile for userId: ${userId}`, error);
    return prep.response(false, messages.profile_fetch_error, undefined);
  }
}

/**
 * Fetches the combined base user data and profile for a single user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the combined user data.
 */
export async function getUser(userId: string): Promise<IResolve<{ base: IUser; profile: IUserProfile } | null>> {
    try {
      const userResult = await database.getUser(userId);
      if (!userResult.success || !userResult.data) {
        return prep.response(false, userResult.message || messages.user_not_found, null);
      }
  
      const profileResult = await getUserProfile(userId);
      if (!profileResult.success || !profileResult.data) {
        return prep.response(false, profileResult.message || messages.profile_fetch_error, null);
      }
  
      const fullUser = {
        base: userResult.data,
        profile: profileResult.data,
      };
  
      return prep.response(true, messages.success, fullUser);
    } catch (error) {
      console.error(`Error in getUser for userId: ${userId}`, error);
      return prep.response(false, messages.user_fetch_error, null);
    }
  }

/**
 * Sets a new password for a user.
 * @param userId The ID of the user whose password is to be set.
 * @param newPassword The new password to set.
 * @returns A promise that resolves to an IResolve object indicating success or failure.
 */
export async function setPassword(userId: string, newPassword: string): Promise<IResolve<null>> {
  try {
    const hashedPassword = await hashPassword(newPassword); // Hash the new password
    const updateResult = await database.updateUser(userId, { password_hash: hashedPassword });

    if (updateResult.success) {
      return prep.response(true, messages.success, null);
    } else {
      return prep.response(false, updateResult.message || messages.failure, null);
    }
  } catch (error) {
    console.error(`Error in setPassword for userId: ${userId}`, error);
    return prep.response(false, messages.failure, null);
  }
}