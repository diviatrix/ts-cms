export interface IUser {
    id: string;
    login: string; // Unique login identifier for the user
    email: string;
    passwordHash: string; // Store hashed passwords, not plain text
}