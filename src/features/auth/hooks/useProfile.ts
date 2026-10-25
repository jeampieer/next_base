"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    getProfileApi,
    updateProfileApi,
    changePasswordApi,
} from "@/features/auth/services/profile.api";
import { logoutAction, syncSessionAction } from "@/features/auth/actions/auth.actions";
import type { ProfileInput, PasswordInput } from "@/features/auth/types/auth.types";
import { QUERY_KEYS } from "@/lib/query";
import { useOperation } from "@/hooks/useOperation";
export function useProfile() {
    const client = useQueryClient();
    const router = useRouter();
    const run = useOperation();
    const query = useQuery({ queryKey: QUERY_KEYS.profile, queryFn: getProfileApi });
    const update = useMutation({
        mutationFn: ({ id, input }: { id: string; input: ProfileInput }) =>
            updateProfileApi(id, input),
    });
    const password = useMutation({ mutationFn: changePasswordApi });
    return {
        query,
        updating: update.isPending,
        changingPassword: password.isPending,
        updateProfile: (id: string, input: ProfileInput) =>
            run(async () => {
                const user = await update.mutateAsync({ id, input });
                await syncSessionAction();
                await client.invalidateQueries({ queryKey: QUERY_KEYS.profile });
                router.refresh();
                return user;
            }, "Perfil actualizado"),
        changePassword: (input: PasswordInput) =>
            run(async () => {
                await password.mutateAsync(input);
                await logoutAction();
                client.clear();
                router.replace("/login");
                router.refresh();
            }, "Contraseña actualizada. Inicia sesión nuevamente."),
    };
}
