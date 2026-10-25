import type { IdentityApi, Identity, Tokens } from "@/lib/auth/types";
export interface LoginInput {
    username: string;
    password: string;
}
export interface LoginApi extends Tokens {
    user: IdentityApi;
}
export interface Login extends Tokens {
    user: Identity;
}
export interface ProfileInput {
    email: string;
    firstName: string;
    lastName: string;
}
export interface ProfileWriteApi {
    email: string;
    first_name: string;
    last_name: string;
}
export interface PasswordInput {
    currentPassword: string;
    newPassword: string;
}
