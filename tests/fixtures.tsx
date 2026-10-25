import type { ReactNode } from "react";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AntdConfigProvider } from "@/providers/AntdConfigProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import type { IdentityApi, Identity } from "@/lib/auth/types";
import { IdentityFormatter } from "@/lib/auth/formatter";
import type { ApiEnvelope, PaginationApi } from "@/types/api";
export const id = "11111111-1111-4111-8111-111111111111";
export const labelId = "22222222-2222-4222-8222-222222222222";
export const base = {
    id,
    is_active: true,
    created: "2026-01-01T10:00:00Z",
    modified: "2026-01-01T10:00:00Z",
    created_by: null,
    updated_by: null,
};
export const identityApi: IdentityApi = {
    ...base,
    username: "synthetic.manager",
    email: "manager@example.test",
    first_name: "Usuario",
    last_name: "Sintético",
    role: "MANAGER",
    last_login: null,
    last_password_change: null,
};
export const identity = IdentityFormatter.fromDB(identityApi);
export const labelApi = { ...base, id: labelId, name: "Etiqueta sintética" };
export const pagination: PaginationApi = {
    page: 1,
    per_page: 10,
    total: 1,
    total_pages: 1,
    next: null,
    previous: null,
};
export function envelope<T>(data: T, paginated = false): ApiEnvelope<T> {
    return {
        success: true,
        status: "success",
        message: "Correcto",
        data,
        meta: { timestamp: base.created, ...(paginated ? { pagination } : {}) },
    };
}
export function token(seconds = 3600): string {
    return `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`;
}
export function createWrapper(user: Identity | null = identity) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>
                <ConfigProvider theme={{ token: { motion: false } }}>
                    <AntdConfigProvider>
                        <SessionProvider user={user}>{children}</SessionProvider>
                    </AntdConfigProvider>
                </ConfigProvider>
            </QueryClientProvider>
        );
    }
    return { client, Wrapper };
}
