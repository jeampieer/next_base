import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/backend.server";
import { readTokens } from "@/lib/auth/session.server";
type Context = { params: Promise<{ path: string[] }> };
async function bridge(request: NextRequest, context: Context) {
    const { access } = await readTokens();
    if (!access)
        return NextResponse.json(
            { success: false, message: "Sesión no disponible" },
            { status: 401 }
        );
    const { path } = await context.params;
    if (
        path[0] !== "api" ||
        path[1] !== "v1" ||
        path.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))
    )
        return NextResponse.json({ success: false }, { status: 400 });
    const url = new URL(`/${path.join("/")}/`, BACKEND_URL);
    url.search = request.nextUrl.search;
    const headers = new Headers({ Authorization: `Bearer ${access}`, Accept: "application/json" });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    try {
        const response = await fetch(url, {
            method: request.method,
            headers,
            body: ["GET", "HEAD"].includes(request.method)
                ? undefined
                : await request.arrayBuffer(),
            cache: "no-store",
            redirect: "manual",
        });
        return new NextResponse(
            [204, 304].includes(response.status) ? null : await response.arrayBuffer(),
            {
                status: response.status,
                headers: {
                    "Content-Type": response.headers.get("content-type") ?? "application/json",
                },
            }
        );
    } catch {
        return NextResponse.json(
            { success: false, message: "El backend no está disponible." },
            { status: 502 }
        );
    }
}
export const GET = bridge;
export const POST = bridge;
export const PUT = bridge;
export const PATCH = bridge;
export const DELETE = bridge;
