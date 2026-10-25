import type { IdentityApi, Identity } from "@/lib/auth/types";
import type { ListInput } from "@/types/api";
export type UserApi = IdentityApi;
export type User = Identity;
export interface UserInput {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    role?: string;
}
export interface UserWriteApi {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    role?: string;
}
export interface UserListInput extends ListInput {
    role?: string;
}
export type UserAction = "role" | "password";
export interface UserActionInput {
    role?: string;
    newPassword?: string;
    currentPassword?: string;
}
