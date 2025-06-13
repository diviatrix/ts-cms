export default interface IUser {
    id: string;
    login: string; // Unique login identifier for the user
    email: string;
    password_hash: string; // Store hashed passwords, not plain text
}