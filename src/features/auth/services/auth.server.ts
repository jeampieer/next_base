import { serverApiClient } from "@/lib/api/server";
import { unwrap } from "@/lib/api/response";
import { IdentityFormatter } from "@/lib/auth/formatter";
import type { IdentityApi } from "@/lib/auth/types";
import type { ApiEnvelope } from "@/types/api";
import type { LoginInput, LoginApi } from "@/features/auth/types/auth.types";
import { AuthFormatter } from "@/features/auth/utils/formatters/auth";
export async function loginApi(input: LoginInput) {
    const response = await serverApiClient.post<ApiEnvelope<LoginApi>>("/api/v1/auth/token/", {
        username: input.username,
        password: input.password,
    });
    return AuthFormatter.fromDB(unwrap(response.data));
}
export async function refreshApi(refresh: string): Promise<string> {
    const response = await serverApiClient.post<ApiEnvelope<{ access: string }>>(
        "/api/v1/auth/token/refresh/",
        { refresh }
    );
    return unwrap(response.data).access;
}
export async function meApi(access: string) {
    const response = await serverApiClient.get<ApiEnvelope<IdentityApi>>("/api/v1/auth/me/", {
        headers: { Authorization: `Bearer ${access}` },
    });
    return IdentityFormatter.fromDB(unwrap(response.data));
}
export async function revokeApi(access: string): Promise<void> {
    await serverApiClient.post(
        "/api/v1/auth/logout/",
        {},
        { headers: { Authorization: `Bearer ${access}` } }
    );
}
