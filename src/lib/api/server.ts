import axios from "axios";
import { BACKEND_URL } from "@/config/backend.server";
export const serverApiClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});
