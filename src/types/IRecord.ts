export default interface IRecord {
    id: string;
    title: string;
    description: string;
    content: string;
    user_id: string;
    tags: string[];
    categories: string[];
    is_published: boolean;
    created_at: Date;
    updated_at: Date;
}