import database from '../db';
import messages from '../data/messages';
import IResolve from '../types/IResolve';
import IUserProfile from '../types/IUserProfile';
import prep from '../utils/prepare';

export const updateProfile = async (userId: string, profileData: Partial<IUserProfile>): Promise<IResolve<IUserProfile>> => {
  console.log('updateProfile function called for user:', userId, 'with data:', profileData);
  try {
    // Check if profile exists
    console.log('Attempting to get user profile for user:', userId);
    // If profile doesn't exist, create it
    const existingProfile = await database.getUserProfile(userId);
    if (!existingProfile) {
      console.log('No profile found, creating one for user:', userId);
      await database.createUserProfile(userId);
      console.log('User profile created.');
    }

    // Update the profile with the provided data
    console.log('Attempting to update user profile for user:', userId, 'with data:', profileData);
    await database.updateUserProfile(userId, profileData);
    console.log('User profile updated successfully for user:', userId);

    return prep.response(true, messages.profile_update_success);
  } catch (error) {
    console.error(messages.profile_update_error, error);
    return prep.response(false, messages.profile_update_error);
  }
};