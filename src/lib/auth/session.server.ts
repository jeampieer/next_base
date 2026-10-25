import { cookies } from "next/headers";
import { IS_PRODUCTION } from "@/config/public";
import { tokenMaxAge, isTokenExpired } from "@/lib/auth/token";
import type { Identity, Tokens } from "@/lib/auth/types";
export const COOKIE_NAMES = {
    access: "access_token",
    refresh: "refresh_token",
    user: "user_data",
} as const;
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
} as const;
export async function readTokens(): Promise<Partial<Tokens>> {
    const jar = await cookies();
    return {
        access: jar.get(COOKIE_NAMES.access)?.value,
        refresh: jar.get(COOKIE_NAMES.refresh)?.value,
    };
}
export async function saveSession(tokens: Tokens, user: Identity): Promise<void> {
    const jar = await cookies();
    jar.set(COOKIE_NAMES.access, tokens.access, {
        ...COOKIE_OPTIONS,
        maxAge: tokenMaxAge(tokens.access),
    });
    jar.set(COOKIE_NAMES.refresh, tokens.refresh, {
        ...COOKIE_OPTIONS,
        maxAge: tokenMaxAge(tokens.refresh),
    });
    jar.set(COOKIE_NAMES.user, JSON.stringify(user), {
        ...COOKIE_OPTIONS,
        maxAge: tokenMaxAge(tokens.refresh),
    });
}
export async function clearSession(): Promise<void> {
    const jar = await cookies();
    Object.values(COOKIE_NAMES).forEach((name) => jar.delete(name));
}
export async function getSession(): Promise<Identity | null> {
    const jar = await cookies();
    const access = jar.get(COOKIE_NAMES.access)?.value;
    const user = jar.get(COOKIE_NAMES.user)?.value;
    if (!access || isTokenExpired(access) || !user) return null;
    try {
        const parsed: unknown = JSON.parse(user);
        if (isIdentity(parsed)) return parsed;
    } catch {
        return null;
    }
    return null;
}
function isIdentity(value: unknown): value is Identity {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const fields = new Map(Object.entries(value));
    const strings = [
        "id",
        "username",
        "email",
        "firstName",
        "lastName",
        "role",
        "created",
        "modified",
    ];
    const nullable = ["createdBy", "updatedBy", "lastLogin", "lastPasswordChange"];
    return (
        strings.every((key) => typeof fields.get(key) === "string") &&
        typeof fields.get("isActive") === "boolean" &&
        nullable.every((key) => fields.get(key) === null || typeof fields.get(key) === "string")
    );
}
