import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
afterEach(() => vi.unstubAllGlobals());
async function freshClient() {
    vi.resetModules();
    return (await import("@/lib/api/client")).apiClient;
}
describe("refresh compartido y límites", () => {
    it("comparte un refresh entre 401 concurrentes y reintenta una sola vez", async () => {
        const client = await freshClient();
        let complete: ((value: Response) => void) | undefined;
        const request = vi.fn(
            () =>
                new Promise<Response>((resolve) => {
                    complete = resolve;
                })
        );
        vi.stubGlobal("fetch", request);
        client.defaults.adapter = async (config) => {
            if (!("sessionRetried" in config))
                throw new AxiosError("401", "ERR_BAD_RESPONSE", config, undefined, {
                    status: 401,
                    statusText: "Error",
                    data: {},
                    headers: {},
                    config,
                });
            return { data: "ok", status: 200, statusText: "OK", headers: {}, config };
        };
        const calls = Promise.all([client.get("/one?q=1"), client.get("/two/")]);
        await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
        complete?.(new Response(null, { status: 200 }));
        expect((await calls).map((item) => item.data)).toEqual(["ok", "ok"]);
        expect(request).toHaveBeenCalledWith("/api/auth/refresh", { method: "POST" });
    });
    it("un 403 de recurso no renueva ni cierra sesión", async () => {
        const client = await freshClient();
        const request = vi.fn();
        vi.stubGlobal("fetch", request);
        client.defaults.adapter = async (config) => {
            throw new AxiosError("403", "ERR_BAD_RESPONSE", config, undefined, {
                status: 403,
                statusText: "Error",
                data: {},
                headers: {},
                config,
            });
        };
        await expect(client.get("/forbidden")).rejects.toThrow("403");
        expect(request).not.toHaveBeenCalled();
    });
    it("un 403 de renovación comunica permiso sin limpiar cookies", async () => {
        const client = await freshClient();
        const request = vi.fn(async () => new Response(null, { status: 403 }));
        vi.stubGlobal("fetch", request);
        client.defaults.adapter = async (config) => {
            throw new AxiosError("401", "ERR_BAD_RESPONSE", config, undefined, {
                status: 401,
                statusText: "Error",
                data: {},
                headers: {},
                config,
            });
        };
        await expect(client.get("/private")).rejects.toThrow("permiso");
        expect(request).toHaveBeenCalledTimes(1);
    });
    it.each(["failed-refresh", "second-401"])("termina sin bucles: %s", async (scenario) => {
        const client = await freshClient();
        const assign = vi.fn();
        vi.stubGlobal("window", { location: { href: "http://localhost", assign } });
        const request = vi.fn(async (url: string) => {
            if (url.endsWith("logout")) throw new Error("Offline");
            return new Response(null, { status: scenario === "failed-refresh" ? 401 : 200 });
        });
        vi.stubGlobal("fetch", request);
        let attempts = 0;
        client.defaults.adapter = async (config) => {
            attempts++;
            throw new AxiosError("401", "ERR_BAD_RESPONSE", config, undefined, {
                status: 401,
                statusText: "Error",
                data: {},
                headers: {},
                config,
            });
        };
        await expect(client.get("/private")).rejects.toBeInstanceOf(Error);
        expect(attempts).toBe(scenario === "failed-refresh" ? 1 : 2);
        expect(request.mock.calls.filter(([url]) => url.endsWith("logout"))).toHaveLength(1);
        expect(assign).toHaveBeenCalledWith("/login?reason=expired");
    });
    it("normaliza barra sin corromper query y propaga errores sin config", async () => {
        const client = await freshClient();
        const urls: (string | undefined)[] = [];
        client.defaults.adapter = async (config) => {
            urls.push(config.url);
            return { data: "", status: 204, statusText: "", headers: {}, config };
        };
        await client.get("/items?q=a?b");
        expect(urls).toEqual(["/items/?q=a?b"]);
        client.defaults.adapter = async () => {
            throw new Error("Offline");
        };
        await expect(client.get("/x")).rejects.toThrow("Offline");
    });
});
