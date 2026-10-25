import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/lib/api/client";
import { envelope, identityApi, labelApi, pagination } from "./fixtures";
export function installMemoryApi() {
    const state = {
        labels: [labelApi],
        user: { ...identityApi },
        failList: false,
        rejectWrite: false,
        calls: [] as InternalAxiosRequestConfig[],
    };
    apiClient.defaults.adapter = async (config) => {
        state.calls.push(config);
        const url = config.url ?? "";
        const body = config.data ? (JSON.parse(config.data) as Record<string, string>) : {};
        const labels = url.includes("/labels/");
        const list = config.method === "get" && !url.endsWith("/me/");
        if ((state.failList && list) || (state.rejectWrite && config.method !== "get"))
            throw new AxiosError("API error", "ERR_BAD_RESPONSE", config, undefined, {
                status: 400,
                data: {
                    message: "Operación rechazada",
                    error: { details: { name: ["Nombre ocupado"], email: ["Correo ocupado"] } },
                },
                statusText: "Error",
                headers: {},
                config,
            });
        let data: unknown;
        if (list) {
            const items = labels
                ? state.labels.filter((label) =>
                      label.name.toLowerCase().includes(String(config.params.q ?? "").toLowerCase())
                  )
                : [state.user];
            data = {
                ...envelope(items, true),
                meta: {
                    timestamp: "2026-01-01",
                    pagination: {
                        ...pagination,
                        total: items.length,
                        page: config.params.page,
                        per_page: config.params.per_page,
                    },
                },
            };
        } else if (labels) {
            if (config.method === "post")
                state.labels.push({ ...labelApi, id: crypto.randomUUID(), name: body.name });
            if (config.method === "patch")
                state.labels = state.labels.map((label) =>
                    url.includes(label.id) ? { ...label, name: body.name } : label
                );
            if (config.method === "delete")
                state.labels = state.labels.map((label) =>
                    url.includes(label.id) ? { ...label, is_active: false } : label
                );
            data = envelope({ ...labelApi, name: body.name });
        } else {
            if (config.method === "patch") state.user = { ...state.user, ...body };
            data = envelope(state.user);
        }
        return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    return state;
}
