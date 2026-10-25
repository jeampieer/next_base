import { beforeEach, describe, expect, it } from "vitest";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/lib/api/client";
import { serverApiClient } from "@/lib/api/server";
import { loginApi, refreshApi, meApi, revokeApi } from "@/features/auth/services/auth.server";
import {
    getProfileApi,
    updateProfileApi,
    changePasswordApi,
} from "@/features/auth/services/profile.api";
import {
    getLabelsApi,
    createLabelApi,
    updateLabelApi,
    deactivateLabelApi,
} from "@/features/example/services/label.api";
import {
    getUsersApi,
    saveUserApi,
    setUserStateApi,
    userActionApi,
} from "@/features/users/services/user.api";
import { envelope, labelApi, identityApi, id, labelId } from "../fixtures";
function adapter(client: AxiosInstance, body: unknown, status = 200) {
    const calls: InternalAxiosRequestConfig[] = [];
    client.defaults.adapter = async (config) => {
        calls.push(config);
        return { data: body, status, statusText: "OK", headers: {}, config };
    };
    return calls;
}
const input = {
    username: "new",
    email: "new@example.test",
    firstName: "New",
    lastName: "User",
    password: "fictional",
    role: "MEMBER",
};
beforeEach(() => {
    adapter(apiClient, envelope(null));
    adapter(serverApiClient, envelope(null));
});
describe("HTTP y formatters", () => {
    it("lee login/refresh/me dentro de data y no exige rotación", async () => {
        let calls = adapter(
            serverApiClient,
            envelope({ access: "a", refresh: "r", user: identityApi })
        );
        expect((await loginApi({ username: "u", password: "p" })).user.firstName).toBe("Usuario");
        expect(JSON.parse(calls[0].data)).toEqual({ username: "u", password: "p" });
        calls = adapter(serverApiClient, envelope({ access: "new" }));
        expect(await refreshApi("r")).toBe("new");
        expect(JSON.parse(calls[0].data)).toEqual({ refresh: "r" });
        calls = adapter(serverApiClient, envelope(identityApi));
        expect((await meApi("a")).id).toBe(id);
        expect(calls[0].headers.get("Authorization")).toBe("Bearer a");
        await revokeApi("a");
        expect(calls[1].url).toBe("/api/v1/auth/logout/");
    });
    it("lee y escribe perfil y contraseña con campos permitidos", async () => {
        const calls = adapter(apiClient, envelope(identityApi));
        expect((await getProfileApi()).firstName).toBe("Usuario");
        await updateProfileApi(id, input);
        expect(JSON.parse(calls[1].data)).toEqual({
            email: input.email,
            first_name: "New",
            last_name: "User",
        });
        await changePasswordApi({ currentPassword: "old", newPassword: "new" });
        expect(JSON.parse(calls[2].data)).toEqual({ current_password: "old", new_password: "new" });
    });
    it("pagina, crea, edita y desactiva Label; admite respuesta sin contenido", async () => {
        let calls = adapter(apiClient, envelope([labelApi], true));
        expect((await getLabelsApi({ page: 1, pageSize: 10, search: "a" })).pagination.total).toBe(
            1
        );
        expect(calls[0].params).toMatchObject({ q: "a", per_page: 10 });
        calls = adapter(apiClient, envelope(labelApi));
        expect((await createLabelApi({ name: "Nueva" })).id).toBe(labelId);
        expect(JSON.parse(calls[0].data)).toEqual({ name: "Nueva" });
        await updateLabelApi(labelId, { name: "Editada" });
        expect(calls[1].method).toBe("patch");
        calls = adapter(apiClient, "", 204);
        await expect(deactivateLabelApi(labelId)).resolves.toBeUndefined();
        expect(calls[0].method).toBe("delete");
    });
    it("usa los casos de rol, estado y contraseña sin esperar un perfil completo", async () => {
        let calls = adapter(apiClient, envelope([identityApi], true));
        expect((await getUsersApi({ page: 1, pageSize: 10 })).items[0].username).toBe(
            identityApi.username
        );
        calls = adapter(apiClient, envelope(identityApi));
        await saveUserApi(input);
        await saveUserApi(input, id);
        expect(calls.map((call) => call.method)).toEqual(["post", "patch"]);
        expect(JSON.parse(calls[1].data)).not.toHaveProperty("password");
        calls = adapter(apiClient, envelope({ id, role: "MEMBER" }));
        await userActionApi(id, "role", { role: "MEMBER" });
        await userActionApi(id, "password", { newPassword: "new" });
        await setUserStateApi(id, true);
        await setUserStateApi(id, false);
        expect(calls.map((call) => call.url)).toEqual([
            `/api/v1/users/${id}/change-role/`,
            `/api/v1/users/${id}/change-password/`,
            `/api/v1/users/${id}/activate/`,
            `/api/v1/users/${id}/deactivate/`,
        ]);
    });
});
