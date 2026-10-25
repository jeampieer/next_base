import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
export async function startMockBackend() {
    const users = new Map([
        [
            "synthetic.manager",
            {
                id: "11111111-1111-4111-8111-111111111111",
                username: "synthetic.manager",
                email: "manager@example.test",
                first_name: "Usuario",
                last_name: "Sintético",
                role: "MANAGER",
            },
        ],
        [
            "synthetic.member",
            {
                id: "33333333-3333-4333-8333-333333333333",
                username: "synthetic.member",
                email: "member@example.test",
                first_name: "Miembro",
                last_name: "Sintético",
                role: "MEMBER",
            },
        ],
    ]);
    const tokens = new Map<string, string>();
    const refreshes = new Set<string>();
    const labels = new Map<string, Record<string, unknown>>();
    const calls: { method: string; path: string }[] = [];
    let denyNextLabel = false;
    const base = {
        is_active: true,
        created: "2026-01-01T10:00:00Z",
        modified: "2026-01-01T10:00:00Z",
        created_by: null,
        updated_by: null,
    };
    const issue = (username: string, type: string) => {
        const value = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200, user_id: users.get(username)?.id, jti: randomUUID(), token_type: type })).toString("base64url")}.signature`;
        tokens.set(value, username);
        if (type === "refresh") refreshes.add(value);
        return value;
    };
    const server = createServer(async (request, response) => {
        try {
            const url = new URL(request.url ?? "/", "http://localhost");
            const path = url.pathname;
            const method = request.method ?? "GET";
            calls.push({ method, path });
            const buffers: Buffer[] = [];
            for await (const chunk of request) buffers.push(Buffer.from(chunk));
            const raw = Buffer.concat(buffers).toString();
            const body = raw ? (JSON.parse(raw) as Record<string, string>) : {};
            function send(data: unknown, code = 200, message = "Correcto", total?: number) {
                response.writeHead(code, { "Content-Type": "application/json" });
                response.end(
                    JSON.stringify({
                        success: code < 400,
                        status: code < 400 ? "success" : "error",
                        message,
                        data: code < 400 ? data : null,
                        meta: {
                            timestamp: base.created,
                            ...(total !== undefined
                                ? {
                                      pagination: {
                                          page: Number(url.searchParams.get("page") ?? 1),
                                          per_page: Number(url.searchParams.get("per_page") ?? 10),
                                          total,
                                          total_pages: Math.max(1, Math.ceil(total / 10)),
                                          next: null,
                                          previous: null,
                                      },
                                  }
                                : {}),
                        },
                        ...(code >= 400
                            ? {
                                  error: {
                                      code,
                                      type: "mock_error",
                                      message,
                                      details: code === 400 ? { name: ["Nombre inválido"] } : null,
                                      timestamp: base.created,
                                  },
                              }
                            : {}),
                    })
                );
            }
            if (path === "/api/v1/auth/token/" && method === "POST") {
                const user = users.get(body.username);
                if (!user || body.password !== "Fictional-9!Password")
                    return send(null, 401, "Credenciales inválidas");
                return send({
                    access: issue(user.username, "access"),
                    refresh: issue(user.username, "refresh"),
                    user: { ...base, ...user, last_login: null, last_password_change: null },
                });
            }
            if (path === "/api/v1/auth/token/refresh/") {
                const username = tokens.get(body.refresh);
                return username && refreshes.has(body.refresh)
                    ? send({ access: issue(username, "access") })
                    : send(null, 401, "Refresh inválido");
            }
            const access = request.headers.authorization?.replace("Bearer ", "");
            const username = access && tokens.get(access);
            const user = username && users.get(username);
            if (!user) return send(null, 401, "Sin sesión");
            if (path === "/api/v1/auth/me/")
                return send({ ...base, ...user, last_login: null, last_password_change: null });
            if (path === "/api/v1/auth/logout/") {
                for (const value of refreshes)
                    if (tokens.get(value) === username) refreshes.delete(value);
                return send({ detail: "Revocado" });
            }
            if (path === "/api/v1/users/" && method === "GET") {
                const items = [...users.values()].map((value) => ({
                    ...base,
                    ...value,
                    last_login: null,
                    last_password_change: null,
                }));
                return send(items, 200, "Correcto", items.length);
            }
            if (path.startsWith("/api/v1/users/") && method === "PATCH") {
                Object.assign(user, {
                    email: body.email,
                    first_name: body.first_name,
                    last_name: body.last_name,
                });
                return send({ ...base, ...user, last_login: null, last_password_change: null });
            }
            if (path.startsWith("/api/v1/example/labels/")) {
                if (method !== "GET" && (user.role !== "MANAGER" || denyNextLabel)) {
                    denyNextLabel = false;
                    return send(null, 403, "Sin permiso");
                }
                if (method === "GET") {
                    const items = [...labels.values()].filter((item) =>
                        String(item.name).includes(url.searchParams.get("q") ?? "")
                    );
                    const page = Number(url.searchParams.get("page") ?? 1);
                    return send(
                        items.slice((page - 1) * 10, page * 10),
                        200,
                        "Correcto",
                        items.length
                    );
                }
                if (method === "POST") {
                    if (!body.name) return send(null, 400, "Nombre requerido");
                    const item = { ...base, id: randomUUID(), name: body.name };
                    labels.set(item.id, item);
                    return send(item, 201);
                }
                const id = path.split("/").filter(Boolean).at(-1) ?? "";
                const item = labels.get(id);
                if (!item) return send(null, 404, "Ausente");
                if (method === "PATCH") {
                    item.name = body.name;
                    return send(item);
                }
                if (method === "DELETE") {
                    item.is_active = false;
                    return send(null);
                }
            }
            send(null, 404, "Ausente");
        } catch {
            response.writeHead(500);
            response.end();
        }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Puerto no disponible");
    return {
        url: `http://127.0.0.1:${address.port}`,
        calls,
        denyNextWrite: () => {
            denyNextLabel = true;
        },
        close: () =>
            new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve()))
            ),
    };
}
