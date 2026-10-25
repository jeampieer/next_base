"use client";
import axios, { type InternalAxiosRequestConfig } from "axios";
interface RetryConfig extends InternalAxiosRequestConfig {
    sessionRetried?: boolean;
}
export const apiClient = axios.create({
    baseURL: "/api/backend",
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});
let refreshPromise: Promise<void> | undefined;
let logoutPromise: Promise<void> | undefined;
class ForbiddenRefreshError extends Error {}
export async function endBrowserSession(): Promise<void> {
    logoutPromise ??= fetch("/api/auth/logout", { method: "POST" })
        .then(() => undefined)
        .catch(() => undefined);
    await logoutPromise;
    window.location.assign("/login?reason=expired");
}
apiClient.interceptors.request.use((config) => {
    if (config.url) {
        const [path, ...query] = config.url.split("?");
        config.url = `${path.endsWith("/") ? path : `${path}/`}${query.length ? `?${query.join("?")}` : ""}`;
    }
    return config;
});
apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config)
            throw error;
        const config: RetryConfig = error.config;
        if (config.sessionRetried) {
            await endBrowserSession();
            throw error;
        }
        config.sessionRetried = true;
        refreshPromise ??= fetch("/api/auth/refresh", { method: "POST" })
            .then((response) => {
                if (response.status === 403)
                    throw new ForbiddenRefreshError("No tienes permiso para renovar esta sesión.");
                if (!response.ok) throw new Error("La sesión ha caducado.");
            })
            .finally(() => {
                refreshPromise = undefined;
            });
        try {
            await refreshPromise;
        } catch (refreshError) {
            if (!(refreshError instanceof ForbiddenRefreshError)) await endBrowserSession();
            throw refreshError;
        }
        return apiClient.request(config);
    }
);
