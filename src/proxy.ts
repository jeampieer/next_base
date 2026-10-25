import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES, COOKIE_OPTIONS } from "@/lib/auth/session.server";
import { isTokenExpired, tokenMaxAge } from "@/lib/auth/token";
import { homePath } from "@/config/roles";
import { refreshApi, meApi } from "@/features/auth/services/auth.server";
import { extractErrorStatus } from "@/lib/api/errors";
import axios from "axios";
import type { Identity } from "@/lib/auth/types";
export async function proxy(request: NextRequest) {
    const isLogin = request.nextUrl.pathname === "/login";
    let access = request.cookies.get(COOKIE_NAMES.access)?.value;
    const refresh = request.cookies.get(COOKIE_NAMES.refresh)?.value;
    const changed: { name: string; value: string; maxAge: number }[] = [];
    let renewed = false;
    try {
        if (!access || isTokenExpired(access)) {
            if (!refresh || isTokenExpired(refresh)) throw new Error("session_expired");
            access = await refreshApi(refresh);
            renewed = true;
            changed.push({ name: COOKIE_NAMES.access, value: access, maxAge: tokenMaxAge(access) });
        }
        // La identidad y el rol se vuelven a consultar al backend en las navegaciones.
        let user: Identity;
        try {
            user = await meApi(access);
        } catch (error) {
            if (extractErrorStatus(error) !== 401 || renewed || !refresh) throw error;
            access = await refreshApi(refresh);
            changed.push({ name: COOKIE_NAMES.access, value: access, maxAge: tokenMaxAge(access) });
            user = await meApi(access);
        }
        const userCookie = JSON.stringify(user);
        changed.push({
            name: COOKIE_NAMES.user,
            value: userCookie,
            maxAge: tokenMaxAge(refresh ?? access),
        });
        for (const cookie of changed) request.cookies.set(cookie.name, cookie.value);
        const response = isLogin
            ? NextResponse.redirect(new URL(homePath(user.role), request.url))
            : NextResponse.next({ request: { headers: request.headers } });
        for (const cookie of changed)
            response.cookies.set(cookie.name, cookie.value, {
                ...COOKIE_OPTIONS,
                maxAge: cookie.maxAge,
            });
        return response;
    } catch (error) {
        if (axios.isAxiosError(error) && !error.response)
            return new NextResponse("El servicio no está disponible.", { status: 503 });
        if (extractErrorStatus(error) === 403)
            return new NextResponse("No tienes permiso para acceder.", { status: 403 });
        if (extractErrorStatus(error) && extractErrorStatus(error) !== 401)
            return new NextResponse("El servicio no está disponible.", { status: 503 });
        const response = isLogin
            ? NextResponse.next()
            : NextResponse.redirect(new URL("/login?reason=expired", request.url));
        Object.values(COOKIE_NAMES).forEach((name) => response.cookies.delete(name));
        return response;
    }
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
