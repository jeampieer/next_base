"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { loginAction, logoutAction } from "@/features/auth/actions/auth.actions";
import type { LoginInput } from "@/features/auth/types/auth.types";
import { homePath } from "@/config/roles";
import { useAppMessage } from "@/providers/MessageProvider";
export function useAuth() {
    const router = useRouter();
    const client = useQueryClient();
    const message = useAppMessage();
    const [pending, setPending] = useState(false);
    async function login(input: LoginInput) {
        setPending(true);
        try {
            const result = await loginAction(input);
            if (result.success) {
                client.clear();
                router.replace(homePath(result.data.role));
                router.refresh();
            } else message.error(result.message);
            return result;
        } finally {
            setPending(false);
        }
    }
    async function logout() {
        setPending(true);
        try {
            await logoutAction();
            client.clear();
            router.replace("/login");
            router.refresh();
        } finally {
            setPending(false);
        }
    }
    return { login, logout, pending };
}
