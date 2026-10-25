"use client";
import { useAppMessage } from "@/providers/MessageProvider";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api/errors";
import type { OperationResult } from "@/types/api";
export function useOperation() {
    const message = useAppMessage();
    return async function run<T>(
        operation: () => Promise<T>,
        successMessage: string
    ): Promise<OperationResult<T>> {
        try {
            const data = await operation();
            message.success(successMessage);
            return { success: true, data };
        } catch (error) {
            const text = extractErrorMessage(error);
            message.error(text);
            return { success: false, message: text, fields: extractFieldErrors(error) };
        }
    };
}
