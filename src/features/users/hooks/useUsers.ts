"use client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
    getUsersApi,
    saveUserApi,
    setUserStateApi,
    userActionApi,
} from "@/features/users/services/user.api";
import type {
    UserInput,
    UserListInput,
    UserAction,
    UserActionInput,
} from "@/features/users/types/user.types";
import { useOperation } from "@/hooks/useOperation";
import { QUERY_KEYS } from "@/lib/query";
export function useUsers(input: UserListInput) {
    const client = useQueryClient();
    const run = useOperation();
    const query = useQuery({
        queryKey: [...QUERY_KEYS.users, input],
        queryFn: () => getUsersApi(input),
        placeholderData: keepPreviousData,
    });
    const onSuccess = () => client.invalidateQueries({ queryKey: QUERY_KEYS.users });
    const save = useMutation({
        mutationFn: ({ values, id }: { values: UserInput; id?: string }) => saveUserApi(values, id),
        onSuccess,
    });
    const state = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            setUserStateApi(id, active),
        onSuccess,
    });
    const action = useMutation({
        mutationFn: ({
            id,
            name,
            values,
        }: {
            id: string;
            name: UserAction;
            values: UserActionInput;
        }) => userActionApi(id, name, values),
        onSuccess,
    });
    return {
        query,
        pending: save.isPending || state.isPending || action.isPending,
        saveUser: (values: UserInput, id?: string) =>
            run(
                () => save.mutateAsync({ values, id }),
                id ? "Usuario actualizado" : "Usuario creado"
            ),
        setState: (id: string, active: boolean) =>
            run(
                () => state.mutateAsync({ id, active }),
                active ? "Usuario activado" : "Usuario desactivado"
            ),
        performAction: (id: string, name: UserAction, values: UserActionInput) =>
            run(() => action.mutateAsync({ id, name, values }), "Usuario actualizado"),
    };
}
