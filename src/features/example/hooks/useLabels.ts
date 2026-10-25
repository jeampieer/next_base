"use client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
    getLabelsApi,
    createLabelApi,
    updateLabelApi,
    deactivateLabelApi,
} from "@/features/example/services/label.api";
import type { LabelInput, LabelListInput } from "@/features/example/types/label.types";
import { QUERY_KEYS } from "@/lib/query";
import { useOperation } from "@/hooks/useOperation";
export function useLabels(input: LabelListInput) {
    const client = useQueryClient();
    const run = useOperation();
    const query = useQuery({
        queryKey: [...QUERY_KEYS.labels, input],
        queryFn: () => getLabelsApi(input),
        placeholderData: keepPreviousData,
    });
    const onSuccess = () => client.invalidateQueries({ queryKey: QUERY_KEYS.labels });
    const create = useMutation({ mutationFn: createLabelApi, onSuccess });
    const update = useMutation({
        mutationFn: ({ id, values }: { id: string; values: LabelInput }) =>
            updateLabelApi(id, values),
        onSuccess,
    });
    const deactivate = useMutation({ mutationFn: deactivateLabelApi, onSuccess });
    return {
        query,
        pending: create.isPending || update.isPending,
        deactivating: deactivate.isPending,
        createLabel: (values: LabelInput) =>
            run(() => create.mutateAsync(values), "Etiqueta creada"),
        updateLabel: (id: string, values: LabelInput) =>
            run(() => update.mutateAsync({ id, values }), "Etiqueta actualizada"),
        deactivateLabel: (id: string) =>
            run(() => deactivate.mutateAsync(id), "Etiqueta desactivada"),
    };
}
