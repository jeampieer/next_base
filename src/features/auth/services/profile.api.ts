import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/response";
import { IdentityFormatter } from "@/lib/auth/formatter";
import type { IdentityApi } from "@/lib/auth/types";
import type { ApiEnvelope } from "@/types/api";
import type { ProfileInput, PasswordInput } from "@/features/auth/types/auth.types";
import { AuthFormatter } from "@/features/auth/utils/formatters/auth";
export async function getProfileApi() {
    const response = await apiClient.get<ApiEnvelope<IdentityApi>>("/api/v1/auth/me/");
    return IdentityFormatter.fromDB(unwrap(response.data));
}
export async function updateProfileApi(id: string, input: ProfileInput) {
    const response = await apiClient.patch<ApiEnvelope<IdentityApi>>(
        `/api/v1/users/${id}/`,
        AuthFormatter.toDB(input)
    );
    return IdentityFormatter.fromDB(unwrap(response.data));
}
export async function changePasswordApi(input: PasswordInput): Promise<void> {
    await apiClient.post("/api/v1/users/change-password/", AuthFormatter.passwordToDB(input));
}
