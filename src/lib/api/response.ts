import type { ApiEnvelope, BaseApi, BaseModel, Page } from "@/types/api";
export function unwrap<T>(body: ApiEnvelope<T>): T {
    if (!body.success || body.data === null || body.data === undefined) {
        throw new Error(body.message || "La API devolvió una respuesta sin datos.");
    }
    return body.data;
}
export function mapBase(api: BaseApi): BaseModel {
    return {
        id: api.id,
        isActive: api.is_active,
        created: api.created,
        modified: api.modified,
        createdBy: api.created_by,
        updatedBy: api.updated_by,
    };
}
export function mapPage<A, T>(body: ApiEnvelope<A[]>, formatter: (value: A) => T): Page<T> {
    const items = unwrap(body).map(formatter);
    const pagination = body.meta.pagination;
    if (!pagination) throw new Error("La API no devolvió la paginación requerida.");
    return {
        items,
        pagination: {
            page: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            totalPages: pagination.total_pages,
        },
    };
}
