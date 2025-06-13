import database from '../db';
import IUser from '../types/IUser';
import IUserProfile from '../types/IUserProfile';


// Define an interface that combines necessary user and profile properties for the admin view
export interface IUserAdminView {
  base: IUser;
  profile: IUserProfile;
}

export async function getAllBaseUsers(): Promise<IUserAdminView[]> {
  try {
    // database.getAllUsersWithProfiles now returns objects matching IUserAdminView
    const users = (await database.getAllBaseUsers()).data;
    const adminViewUsers: IUserAdminView[] = [];

    for (const user of users) {
      const profile = (await database.getUserProfile(user.id)).data;
      if (profile) {
        adminViewUsers.push({ base: user, profile });
      }
    }
 return adminViewUsers;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error; // Re-throw the error
  }
}