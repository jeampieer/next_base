import axios from "axios";
function record(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function bodyOf(error: unknown): Record<string, unknown> | undefined {
    return axios.isAxiosError(error) && record(error.response?.data)
        ? error.response.data
        : undefined;
}
export function extractErrorStatus(error: unknown): number | undefined {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
}
export function extractErrorMessage(error: unknown): string {
    if (extractErrorStatus(error) === 403) return "No tienes permiso para realizar esta acción.";
    const body = bodyOf(error);
    const detail = body && record(body.error) ? body.error : undefined;
    if (typeof body?.message === "string" && body.message) return body.message;
    if (typeof detail?.message === "string") return detail.message;
    return error instanceof Error ? error.message : "No se pudo conectar con el servidor.";
}
export function extractFieldErrors(error: unknown): Record<string, string[]> {
    const body = bodyOf(error);
    const details = body && record(body.error) ? body.error.details : undefined;
    if (!record(details)) return {};
    return Object.fromEntries(
        Object.entries(details).flatMap(([key, value]) => {
            const messages =
                typeof value === "string"
                    ? [value]
                    : Array.isArray(value)
                      ? value.filter((item): item is string => typeof item === "string")
                      : [];
            return messages.length && key !== "non_field_errors" && key !== "detail"
                ? [
                      [
                          key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
                          messages,
                      ],
                  ]
                : [];
        })
    );
}
