import type { BaseApi, BaseModel } from "@/types/api";
export interface IdentityApi extends BaseApi {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    last_login: string | null;
    last_password_change: string | null;
}
export interface Identity extends BaseModel {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    lastLogin: string | null;
    lastPasswordChange: string | null;
}
export interface Tokens {
    access: string;
    refresh: string;
}
