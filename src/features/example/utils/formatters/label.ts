import { mapBase } from "@/lib/api/response";
import type {
    LabelApi,
    Label,
    LabelInput,
    LabelWriteApi,
    LabelListInput,
} from "@/features/example/types/label.types";
export class LabelFormatter {
    static fromDB(api: LabelApi): Label {
        return { ...mapBase(api), name: api.name };
    }
    static toDB(input: LabelInput): LabelWriteApi {
        return { name: input.name };
    }
    static filtersToDB(input: LabelListInput) {
        return {
            page: input.page,
            per_page: input.pageSize,
            q: input.search || undefined,
            is_active: input.isActive === undefined ? undefined : input.isActive ? "1" : "0",
            order_by: "-created",
        };
    }
}
