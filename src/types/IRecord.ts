export default interface IRecord {
    id: string;
    title: string;
    description: string;
    content: string;
    image_url?: string; // Optional image URL for record
    user_id: string;
    tags: string[];
    categories: string[];
    is_published: boolean;
    created_at: Date;
    updated_at: Date;
}