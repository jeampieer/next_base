export interface BaseApi {
    id: string;
    is_active: boolean;
    created: string;
    modified: string;
    created_by: string | null;
    updated_by: string | null;
}
export interface BaseModel {
    id: string;
    isActive: boolean;
    created: string;
    modified: string;
    createdBy: string | null;
    updatedBy: string | null;
}
export interface PaginationApi {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
}
export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface ApiEnvelope<T> {
    success: boolean;
    status: "success" | "error";
    message: string | null;
    data: T | null;
    meta: { timestamp: string; pagination?: PaginationApi };
    error?: { code: number; type: string; message: string; details?: unknown; timestamp: string };
}
export interface Page<T> {
    items: T[];
    pagination: Pagination;
}
export interface ListInput {
    page: number;
    pageSize: number;
    search?: string;
    isActive?: boolean;
}
export type OperationResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; message: string; fields: Record<string, string[]> };
