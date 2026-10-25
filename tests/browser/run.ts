import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { startMockBackend } from "./mock-backend";
const require = createRequire(import.meta.url);
async function freePort() {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Puerto ausente");
    const port = address.port;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    return port;
}
async function waitUntilReady(url: string, process: ReturnType<typeof spawn>) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (process.exitCode !== null)
            throw new Error("El servidor Next terminó antes de estar listo.");
        try {
            if ((await fetch(`${url}/login`)).status === 200) return;
        } catch {
            /* Reintento acotado durante arranque. */
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("Next no respondió durante el arranque.");
}
async function login(page: Page, base: string, username: string) {
    await page.goto(`${base}/login`);
    await page.getByLabel("Usuario", { exact: true }).fill(username);
    await page.getByLabel("Contraseña", { exact: true }).fill("Fictional-9!Password");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.waitForURL(username.endsWith("manager") ? "**/users" : "**/profile");
}
async function browserRequest(page: Page, path: string, method: string, data?: object) {
    return page.evaluate(
        async ({ path, method, data }) => {
            const response = await fetch(path, {
                method,
                headers: { "Content-Type": "application/json" },
                body: data ? JSON.stringify(data) : undefined,
            });
            return response.status;
        },
        { path, method, data }
    );
}
async function main() {
    await mkdir("test-results", { recursive: true });
    const realBackend = process.env.SMOKE_BACKEND_URL;
    const mock = realBackend ? undefined : await startMockBackend();
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    const server = spawn(
        process.execPath,
        [require.resolve("next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
        {
            env: {
                ...process.env,
                BACKEND_URL: realBackend ?? mock?.url,
                NEXT_TELEMETRY_DISABLED: "1",
            },
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
        }
    );
    let logs = "";
    server.stdout?.on("data", (chunk) => {
        logs += String(chunk);
    });
    server.stderr?.on("data", (chunk) => {
        logs += String(chunk);
    });
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
        await waitUntilReady(base, server);
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${base}/labels`);
        assert.match(page.url(), /\/login/);
        await login(page, base, "synthetic.manager");
        const cookies = await context.cookies();
        for (const name of ["access_token", "refresh_token", "user_data"])
            assert.equal(cookies.find((cookie) => cookie.name === name)?.httpOnly, true);
        assert.equal(await page.evaluate(() => document.cookie.includes("access_token")), false);
        await page.getByRole("link", { name: "Mi perfil", exact: true }).click();
        await page.getByText("manager@example.test", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Editar perfil" }).click();
        let drawer = page.getByRole("dialog");
        await drawer.getByLabel("Nombres").fill("Perfil actualizado");
        await drawer.getByRole("button", { name: "Guardar" }).click();
        await drawer.waitFor({ state: "hidden" });
        await page.getByText("Perfil actualizado Sintético").waitFor();
        // Fuerza renovación mediante el endpoint real del frontend usando sus cookies de login.
        assert.equal(await browserRequest(page, "/api/auth/refresh", "POST"), 200);
        await page.getByRole("link", { name: "Etiquetas", exact: true }).click();
        await page.getByRole("button", { name: "Nueva etiqueta" }).click();
        drawer = page.getByRole("dialog");
        await drawer.getByRole("button", { name: "Guardar" }).click();
        await drawer.getByText("Ingresa un nombre").waitFor();
        await drawer.getByLabel("Nombre").fill("Smoke sintético");
        await drawer.getByRole("button", { name: "Guardar" }).click();
        await drawer.waitFor({ state: "hidden" });
        let row = page.getByRole("row").filter({ hasText: "Smoke sintético" });
        await row.getByRole("button", { name: "Editar" }).click();
        drawer = page.getByRole("dialog");
        await drawer.getByLabel("Nombre").fill("Smoke actualizado");
        await drawer.getByRole("button", { name: "Guardar" }).click();
        await drawer.waitFor({ state: "hidden" });
        row = page.getByRole("row").filter({ hasText: "Smoke actualizado" });
        await row.getByRole("button", { name: "Desactivar" }).click();
        await page.getByRole("tooltip").getByRole("button", { name: "Desactivar" }).click();
        await row.getByText("Inactivo").waitFor();
        await page.getByRole("searchbox", { name: "Buscar etiquetas" }).fill("Ausente");
        await page.getByText("No hay etiquetas").waitFor();
        await page.getByRole("searchbox", { name: "Buscar etiquetas" }).fill("");
        await row.waitFor();
        if (mock) {
            mock.denyNextWrite();
            await row.getByRole("button", { name: "Editar" }).click();
            drawer = page.getByRole("dialog");
            await drawer.getByLabel("Nombre").fill("Denegada");
            await drawer.getByRole("button", { name: "Guardar" }).click();
            await drawer.getByText("No tienes permiso para realizar esta acción.").waitFor();
            await drawer.getByRole("button", { name: "Cerrar", exact: true }).click();
            assert.ok((await context.cookies()).some((cookie) => cookie.name === "access_token"));
        }
        await page.screenshot({ path: "test-results/labels.png", fullPage: true });
        await page.getByRole("button", { name: "Cerrar sesión" }).click();
        await page.waitForURL("**/login");
        assert.equal(
            (await context.cookies()).some((cookie) => cookie.name === "refresh_token"),
            false
        );
        assert.equal(await browserRequest(page, "/api/auth/refresh", "POST"), 401);
        await login(page, base, "synthetic.member");
        await page.getByRole("link", { name: "Etiquetas", exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Nueva etiqueta" }).count(), 0);
        assert.equal(
            await browserRequest(page, "/api/backend/api/v1/example/labels/", "POST", {
                name: "Denegada real",
            }),
            403
        );
        assert.equal(await browserRequest(page, "/api/backend/api/v1/auth/me/", "GET"), 200);
        await page.getByRole("button", { name: "Cerrar sesión" }).click();
        await page.waitForURL("**/login");
        assert.deepEqual(errors, []);
        const result = {
            backend: realBackend ? "django-real" : "simulado",
            checks: [
                "protección SSR",
                "login real desde formulario",
                "perfil y actualización",
                "cookies httpOnly",
                "refresh",
                "Label crear/editar/desactivar/buscar",
                "403 sin logout",
                "revocación y limpieza local",
            ],
            passed: true,
        };
        await writeFile("test-results/browser-result.json", JSON.stringify(result, null, 2));
        console.log(JSON.stringify(result));
        await context.close();
    } finally {
        await browser?.close();
        server.kill();
        await mock?.close();
        await writeFile("test-results/next-server.log", logs);
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
