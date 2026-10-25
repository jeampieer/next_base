import { apiClient } from "@/lib/api/client";
import { unwrap, mapPage } from "@/lib/api/response";
import type { ApiEnvelope } from "@/types/api";
import type { LabelApi, LabelInput, LabelListInput } from "@/features/example/types/label.types";
import { LabelFormatter } from "@/features/example/utils/formatters/label";
const URL = "/api/v1/example/labels/";
export async function getLabelsApi(input: LabelListInput) {
    const response = await apiClient.get<ApiEnvelope<LabelApi[]>>(URL, {
        params: LabelFormatter.filtersToDB(input),
    });
    return mapPage(response.data, LabelFormatter.fromDB);
}
export async function createLabelApi(input: LabelInput) {
    const response = await apiClient.post<ApiEnvelope<LabelApi>>(URL, LabelFormatter.toDB(input));
    return LabelFormatter.fromDB(unwrap(response.data));
}
export async function updateLabelApi(id: string, input: LabelInput) {
    const response = await apiClient.patch<ApiEnvelope<LabelApi>>(
        `${URL}${id}/`,
        LabelFormatter.toDB(input)
    );
    return LabelFormatter.fromDB(unwrap(response.data));
}
export async function deactivateLabelApi(id: string): Promise<void> {
    await apiClient.delete(`${URL}${id}/`);
}
