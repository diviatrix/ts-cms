import database from '../db';
import messages from '../data/messages';
import IResolve from '../types/IResolve';
import IUserProfile from '../types/IUserProfile';
import prep from '../utils/prepare';

export const updateProfile = async (userId: string, profileData: Partial<IUserProfile>): Promise<IResolve<IUserProfile>> => {
  try {
    // Check if profile exists
    const existingProfile = await database.getUserProfile(userId);
    if (!existingProfile) {
      // If profile doesn't exist, create it
      await database.createUserProfile(userId);
    }

    // Update the profile with the provided data
    await database.updateUserProfile(userId, profileData);

    return prep.response(true, messages.profile_update_success);
  } catch (error) {
    console.error(messages.profile_update_error, error);
    return prep.response(false, messages.profile_update_error);
  }
};