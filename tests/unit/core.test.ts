import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { unwrap, mapPage } from "@/lib/api/response";
import { extractErrorMessage, extractFieldErrors, extractErrorStatus } from "@/lib/api/errors";
import { tokenExpiry, tokenMaxAge, isTokenExpired } from "@/lib/auth/token";
import { ROLE_CATALOG, hasCapability, roleLabel, homePath, isConfiguredRole } from "@/config/roles";
import { LabelFormatter } from "@/features/example/utils/formatters/label";
import { UserFormatter } from "@/features/users/utils/formatters/user";
import { AuthFormatter } from "@/features/auth/utils/formatters/auth";
import { formatDate } from "@/lib/dayjs";
import { envelope, identityApi, labelApi, token } from "../fixtures";
export function apiError(status: number, data: unknown) {
    return new AxiosError("Fallo de red", "ERR_BAD_RESPONSE", undefined, undefined, {
        status,
        data,
        statusText: "Error",
        headers: {},
        config: { headers: new AxiosHeaders() },
    });
}
describe("contratos y escrituras", () => {
    it("convierte identidad y etiqueta conservando UUID y auditoría", () => {
        expect(UserFormatter.fromDB(identityApi)).toMatchObject({
            id: identityApi.id,
            firstName: "Usuario",
            lastName: "Sintético",
            createdBy: null,
        });
        expect(LabelFormatter.fromDB(labelApi)).toMatchObject({
            id: labelApi.id,
            isActive: true,
            name: labelApi.name,
        });
        expect(AuthFormatter.fromDB({ access: "a", refresh: "r", user: identityApi }).user).toEqual(
            UserFormatter.fromDB(identityApi)
        );
    });
    it("limita los campos de escritura por operación", () => {
        const input = {
            username: "x",
            email: "x@example.test",
            firstName: "X",
            lastName: "Y",
            password: "secret",
            role: "MEMBER",
            isActive: false,
        };
        expect(UserFormatter.toDB(input, false)).toEqual({
            username: "x",
            email: input.email,
            first_name: "X",
            last_name: "Y",
        });
        expect(UserFormatter.toDB(input, true)).toEqual({
            username: "x",
            email: input.email,
            first_name: "X",
            last_name: "Y",
            password: "secret",
            role: "MEMBER",
        });
        expect(AuthFormatter.toDB(input)).toEqual({
            email: input.email,
            first_name: "X",
            last_name: "Y",
        });
        expect(LabelFormatter.toDB({ ...labelApi, name: "Nueva" })).toEqual({ name: "Nueva" });
        expect(UserFormatter.roleToDB({ role: "MEMBER", newPassword: "ignored" })).toEqual({
            role: "MEMBER",
        });
        expect(UserFormatter.passwordToDB({ newPassword: "new", currentPassword: "old" })).toEqual({
            new_password: "new",
            current_password: "old",
        });
        expect(UserFormatter.passwordToDB({ newPassword: "new" })).toEqual({ new_password: "new" });
        expect(AuthFormatter.passwordToDB({ currentPassword: "old", newPassword: "new" })).toEqual({
            current_password: "old",
            new_password: "new",
        });
    });
    it.each([undefined, true, false])("convierte filtros sin inventar campos: %s", (isActive) => {
        const input = { page: 2, pageSize: 20, search: "texto", isActive };
        expect(LabelFormatter.filtersToDB(input)).toMatchObject({
            page: 2,
            per_page: 20,
            q: "texto",
            order_by: "-created",
            is_active: isActive === undefined ? undefined : isActive ? "1" : "0",
        });
        expect(UserFormatter.filtersToDB({ ...input, role: "MEMBER" })).toHaveProperty(
            "role",
            "MEMBER"
        );
        expect(LabelFormatter.filtersToDB({ page: 1, pageSize: 10 }).q).toBeUndefined();
        expect(UserFormatter.filtersToDB({ page: 1, pageSize: 10 }).q).toBeUndefined();
    });
    it("valida envelope y paginación sin exigir metadatos ajenos", () => {
        expect(unwrap(envelope(labelApi))).toEqual(labelApi);
        expect(mapPage(envelope([labelApi], true), LabelFormatter.fromDB)).toMatchObject({
            items: [{ name: labelApi.name }],
            pagination: { pageSize: 10, totalPages: 1 },
        });
        expect(() => mapPage(envelope([]), LabelFormatter.fromDB)).toThrow("paginación");
        expect(() => unwrap({ ...envelope(null), message: null })).toThrow("sin datos");
        expect(() =>
            unwrap({ ...envelope(labelApi), success: false, message: "Inválido" })
        ).toThrow("Inválido");
    });
});
describe("errores abiertos", () => {
    it.each([400, 422])("mapea errores por campo para HTTP %s", (status) => {
        const error = apiError(status, {
            message: "Validación",
            error: {
                type: "ValidationError",
                details: {
                    first_name: ["Obligatorio"],
                    email: "No válido",
                    nested: {},
                    ignored: [2],
                    non_field_errors: ["General"],
                },
            },
        });
        expect(extractErrorStatus(error)).toBe(status);
        expect(extractErrorMessage(error)).toBe("Validación");
        expect(extractFieldErrors(error)).toEqual({
            firstName: ["Obligatorio"],
            email: ["No válido"],
        });
    });
    it("distingue 403 y conserva errores generales y detalles variables", () => {
        expect(extractErrorMessage(apiError(403, {}))).toContain("permiso");
        expect(extractErrorMessage(apiError(400, { error: { message: "Integridad" } }))).toBe(
            "Integridad"
        );
        expect(extractErrorMessage(new Error("Offline"))).toBe("Offline");
        expect(extractErrorMessage(null)).toContain("conectar");
        expect(extractErrorMessage(apiError(500, []))).toBe("Fallo de red");
        for (const details of [null, "x", ["x"], 1])
            expect(extractFieldErrors(apiError(400, { error: { details } }))).toEqual({});
        expect(extractFieldErrors(null)).toEqual({});
        expect(extractErrorStatus(null)).toBeUndefined();
    });
});
describe("sesión y catálogo configurable", () => {
    it("usa exp únicamente para duración y detecta vencimiento exacto", () => {
        expect(tokenMaxAge(token())).toBe(3600);
        expect(isTokenExpired(token(0))).toBe(true);
        expect(isTokenExpired(token(-10))).toBe(true);
        for (const input of ["", "x", "a.!.s", `a.${btoa("null")}.s`, `a.${btoa('{"exp":"x"}')}.s`])
            expect(tokenExpiry(input)).toBe(0);
    });
    it("deriva capacidad, etiqueta y destino del catálogo; deniega roles desconocidos", () => {
        expect(hasCapability("MANAGER", "users.manage")).toBe(true);
        expect(hasCapability("MEMBER", "example.write")).toBe(false);
        expect(hasCapability(undefined, "users.manage")).toBe(false);
        expect(hasCapability("ROOT", "users.manage")).toBe(false);
        expect(isConfiguredRole("toString")).toBe(false);
        expect(roleLabel("MANAGER")).toBe(ROLE_CATALOG.MANAGER.label);
        expect(roleLabel("CUSTOM")).toBe("CUSTOM");
        expect(homePath("MANAGER")).toBe("/users");
        expect(homePath("MEMBER")).toBe("/profile");
        expect(formatDate(null)).toBe("—");
        expect(formatDate("2026-01-01T10:00:00")).toBe("01/01/2026 10:00");
    });
});
