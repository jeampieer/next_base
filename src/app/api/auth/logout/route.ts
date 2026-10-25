import { NextResponse } from "next/server";
import { terminateSession } from "@/features/auth/server/session.server";
export async function POST() {
    await terminateSession();
    return NextResponse.json({ success: true });
}
