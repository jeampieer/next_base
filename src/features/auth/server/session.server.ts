import { readTokens, clearSession, saveSession } from "@/lib/auth/session.server";
import { extractErrorStatus } from "@/lib/api/errors";
import { isTokenExpired } from "@/lib/auth/token";
import { refreshApi, revokeApi, meApi } from "@/features/auth/services/auth.server";
// Adaptador de sesión: comparte revocación entre acción de logout y Route Handler.
export async function terminateSession(): Promise<void> {
    try {
        const tokens = await readTokens();
        let access = tokens.access;
        const refresh = tokens.refresh;
        if ((!access || isTokenExpired(access)) && refresh) access = await refreshApi(refresh);
        if (access) {
            try {
                await revokeApi(access);
            } catch (error) {
                if (extractErrorStatus(error) === 401 && refresh)
                    await revokeApi(await refreshApi(refresh));
            }
        }
    } catch {
        /* La limpieza local también se ejecuta si el backend no responde. */
    } finally {
        await clearSession();
    }
}
export async function renewSession(): Promise<void> {
    const { refresh } = await readTokens();
    if (!refresh) throw new Error("No hay sesión renovable.");
    const access = await refreshApi(refresh);
    const user = await meApi(access);
    await saveSession({ access, refresh }, user);
}
