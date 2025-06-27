export default interface IUploadFile {
    id: string; // Unique identifier for the file
    name: string; // Original name of the file
    size: number; // Size of the file in bytes
    path: string; // Path where the file is stored
    type: string; // MIME type of the file (e.g., 'image/png', 'application/pdf')
    url: string; // URL where the file is stored
    createdAt: Date; // Timestamp when the file was uploaded
    createdBy: string; // ID of the user who uploaded the file
    tags: string[]; // Tags associated with the file
    categories: string[]; // Categories associated with the file
    isPublic: boolean; // Whether the file is publicly accessible
    updatedAt: Date; // Timestamp when the file was last updated
}