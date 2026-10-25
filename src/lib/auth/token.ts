// Solo consulta exp. No verifica firma ni acredita identidad o permisos.
export function tokenExpiry(token: string): number {
    try {
        const segment = token.split(".")[1];
        if (!segment) return 0;
        const payload: unknown = JSON.parse(atob(segment.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof payload === "object" &&
            payload !== null &&
            "exp" in payload &&
            typeof payload.exp === "number" &&
            Number.isFinite(payload.exp)
            ? payload.exp
            : 0;
    } catch {
        return 0;
    }
}
export function tokenMaxAge(token: string): number {
    return Math.max(0, tokenExpiry(token) - Math.floor(Date.now() / 1000));
}
export function isTokenExpired(token: string): boolean {
    return tokenMaxAge(token) === 0;
}
