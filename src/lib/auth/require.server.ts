import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session.server";
export async function requireAuth() {
    const user = await getSession();
    if (!user) redirect("/login");
    return user;
}
