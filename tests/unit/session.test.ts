import { describe, it, expect, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { serverApiClient } from "@/lib/api/server";
import { loginAction, logoutAction, syncSessionAction } from "@/features/auth/actions/auth.actions";
import { terminateSession, renewSession } from "@/features/auth/server/session.server";
import {
    getSession,
    readTokens,
    saveSession,
    clearSession,
    COOKIE_NAMES,
} from "@/lib/auth/session.server";
import { requireAuth } from "@/lib/auth/require.server";
import { jar, cookieStore } from "../setup";
import { envelope, identity, identityApi, token } from "../fixtures";
function failure(status: number) {
    return new AxiosError("Denegado", "ERR_BAD_RESPONSE", undefined, undefined, {
        status,
        data: { message: "Denegado", error: { details: { username: ["No válido"] } } },
        statusText: "Error",
        headers: {},
        config: { headers: new AxiosHeaders() },
    });
}
describe("cookies y sesión", () => {
    it("guarda httpOnly con duración derivada de exp y recupera el snapshot", async () => {
        await saveSession({ access: token(), refresh: token(7200) }, identity);
        expect(cookieStore.set).toHaveBeenCalledWith(
            COOKIE_NAMES.access,
            expect.any(String),
            expect.objectContaining({ httpOnly: true, sameSite: "strict", maxAge: 3600 })
        );
        expect(await getSession()).toEqual(identity);
        expect(await requireAuth()).toEqual(identity);
        expect(await readTokens()).toHaveProperty("refresh");
        await clearSession();
        expect(await getSession()).toBeNull();
        await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
    });
    it.each([
        "{",
        "null",
        "[]",
        "{}",
        '{"id":2,"role":"MEMBER"}',
        JSON.stringify({ ...identity, createdBy: 12 }),
        JSON.stringify({ ...identity, isActive: "true" }),
    ])("rechaza snapshot inválido: %s", async (value) => {
        jar.set(COOKIE_NAMES.access, { value: token() });
        jar.set(COOKIE_NAMES.user, { value });
        expect(await getSession()).toBeNull();
    });
    it("rechaza access vencido y datos de usuario ausentes", async () => {
        await saveSession({ access: token(-1), refresh: token() }, identity);
        expect(await getSession()).toBeNull();
        jar.set(COOKIE_NAMES.access, { value: token() });
        jar.delete(COOKIE_NAMES.user);
        expect(await getSession()).toBeNull();
    });
});
describe("adaptadores de autenticación", () => {
    it("login guarda tokens en cookies y devuelve solo rol al cliente", async () => {
        const access = token();
        const refresh = token(7200);
        serverApiClient.defaults.adapter = async (config) => ({
            data: envelope({ access, refresh, user: identityApi }),
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });
        expect(await loginAction({ username: "synthetic", password: "fictional" })).toEqual({
            success: true,
            data: { role: "MANAGER" },
        });
        expect((await readTokens()).refresh).toBe(refresh);
    });
    it("serializa errores de login sin incluir tokens", async () => {
        serverApiClient.defaults.adapter = async () => {
            throw failure(400);
        };
        expect(await loginAction({ username: "x", password: "x" })).toEqual({
            success: false,
            message: "Denegado",
            fields: { username: ["No válido"] },
        });
    });
    it("renueva y sincroniza identidad desde me", async () => {
        jar.set(COOKIE_NAMES.refresh, { value: token(7200) });
        serverApiClient.defaults.adapter = async (config) => ({
            data: envelope(config.url?.endsWith("refresh/") ? { access: token() } : identityApi),
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        });
        await renewSession();
        await syncSessionAction();
        expect(await getSession()).toEqual(identity);
        jar.clear();
        await syncSessionAction();
        await expect(renewSession()).rejects.toThrow("renovable");
    });
    it("logout revoca y limpia; si access venció usa refresh real del service", async () => {
        const calls: string[] = [];
        await saveSession({ access: token(-1), refresh: token(7200) }, identity);
        serverApiClient.defaults.adapter = async (config) => {
            calls.push(config.url ?? "");
            return {
                data: envelope({ access: token() }),
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        await logoutAction();
        expect(calls).toEqual(["/api/v1/auth/token/refresh/", "/api/v1/auth/logout/"]);
        expect(jar.size).toBe(0);
    });
    it.each([401, 403, 500])(
        "limpia cookies incluso si revocación falla con %s",
        async (status) => {
            await saveSession({ access: token(), refresh: token(7200) }, identity);
            let count = 0;
            serverApiClient.defaults.adapter = async (config) => {
                if (config.url?.endsWith("refresh/"))
                    return {
                        data: envelope({ access: token() }),
                        status: 200,
                        statusText: "OK",
                        headers: {},
                        config,
                    };
                count++;
                throw failure(status);
            };
            await terminateSession();
            expect(jar.size).toBe(0);
            expect(count).toBe(status === 401 ? 2 : 1);
        }
    );
    it("limpia sin tokens y ante refresh imposible", async () => {
        await terminateSession();
        jar.set(COOKIE_NAMES.refresh, { value: token() });
        serverApiClient.defaults.adapter = vi.fn(async () => {
            throw new Error("Offline");
        });
        await terminateSession();
        expect(jar.size).toBe(0);
    });
});
