import { apiClient } from "@/lib/api/client";
import { unwrap, mapPage } from "@/lib/api/response";
import type { ApiEnvelope } from "@/types/api";
import type {
    UserApi,
    UserInput,
    UserListInput,
    UserAction,
    UserActionInput,
} from "@/features/users/types/user.types";
import { UserFormatter } from "@/features/users/utils/formatters/user";
const URL = "/api/v1/users/";
export async function getUsersApi(input: UserListInput) {
    const response = await apiClient.get<ApiEnvelope<UserApi[]>>(URL, {
        params: UserFormatter.filtersToDB(input),
    });
    return mapPage(response.data, UserFormatter.fromDB);
}
export async function saveUserApi(input: UserInput, id?: string) {
    const body = UserFormatter.toDB(input, !id);
    const response = id
        ? await apiClient.patch<ApiEnvelope<UserApi>>(`${URL}${id}/`, body)
        : await apiClient.post<ApiEnvelope<UserApi>>(URL, body);
    return UserFormatter.fromDB(unwrap(response.data));
}
export async function setUserStateApi(id: string, active: boolean): Promise<void> {
    await apiClient.post(`${URL}${id}/${active ? "activate" : "deactivate"}/`, {});
}
export async function userActionApi(
    id: string,
    action: UserAction,
    input: UserActionInput
): Promise<void> {
    await apiClient.post(
        `${URL}${id}/change-${action}/`,
        action === "role" ? UserFormatter.roleToDB(input) : UserFormatter.passwordToDB(input)
    );
}
