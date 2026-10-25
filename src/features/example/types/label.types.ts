import type { BaseApi, BaseModel, ListInput } from "@/types/api";
export interface LabelApi extends BaseApi {
    name: string;
}
export interface Label extends BaseModel {
    name: string;
}
export interface LabelInput {
    name: string;
}
export interface LabelWriteApi {
    name: string;
}
export type LabelListInput = ListInput;
