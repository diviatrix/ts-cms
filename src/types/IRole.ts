export default interface IRole {
    id: string; // Unique identifier for the role
    weight: number; // Numeric weight for the role, used for sorting or priority
    name: string; // Name of the role (e.g., 'admin', 'editor', 'viewer')
    description?: string; // Optional description of the role
    perms: string[]; // Array of permissions associated with the role
}