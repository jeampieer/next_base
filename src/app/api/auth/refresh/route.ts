import { NextResponse } from "next/server";
import { renewSession, terminateSession } from "@/features/auth/server/session.server";
import { extractErrorStatus } from "@/lib/api/errors";
export async function POST() {
    try {
        await renewSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        const status = extractErrorStatus(error);
        if (status === 403) return NextResponse.json({ success: false }, { status: 403 });
        await terminateSession();
        return NextResponse.json({ success: false }, { status: 401 });
    }
}
