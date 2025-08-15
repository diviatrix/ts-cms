export interface PaginationParams {
    page: number;
    size: number;
    categories?: string[];
    tags?: string[];
    search?: string;
    publishedOnly?: boolean;
}

export interface PaginationMeta {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}