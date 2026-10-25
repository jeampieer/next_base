"use server";
import { loginApi, meApi } from "@/features/auth/services/auth.server";
import { terminateSession } from "@/features/auth/server/session.server";
import { saveSession, readTokens } from "@/lib/auth/session.server";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api/errors";
import type { LoginInput } from "@/features/auth/types/auth.types";
import type { OperationResult } from "@/types/api";
export async function loginAction(input: LoginInput): Promise<OperationResult<{ role: string }>> {
    try {
        const result = await loginApi(input);
        await saveSession(result, result.user);
        return { success: true, data: { role: result.user.role } };
    } catch (error) {
        return {
            success: false,
            message: extractErrorMessage(error),
            fields: extractFieldErrors(error),
        };
    }
}
export async function logoutAction(): Promise<void> {
    await terminateSession();
}
export async function syncSessionAction(): Promise<void> {
    const { access, refresh } = await readTokens();
    if (access && refresh) await saveSession({ access, refresh }, await meApi(access));
}
