import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");
export function formatDate(value: string | null): string {
    return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";
}
