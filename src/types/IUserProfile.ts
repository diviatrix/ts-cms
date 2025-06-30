export default interface IUserProfile {
    user_id: string; // Unique identifier for the user profile
    public_name: string;
    profile_picture_url?: string; // Optional URL for the user's profile picture
    bio?: string; // Optional short biography or description of the user
    created_at: Date;
    updated_at: Date;
}
