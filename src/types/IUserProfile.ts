interface IUserProfile {
    id: string; // Unique identifier for the user profile
    publicName: string;
    isActive: boolean; // Indicates if the user account is active
    roles: string[]; // Array of roles (e.g., 'admin', 'editor', 'viewer')    
    profilePictureUrl?: string; // Optional URL for the user's profile picture
    bio?: string; // Optional short biography or description of the user
    createdAt: Date;
    updatedAt: Date;
}
