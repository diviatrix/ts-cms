interface IRecord {
    id: string;
    title: string;
    description: string;
    content: string;
    authorId: string;
    tags: string[];
    categories: string[];
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}