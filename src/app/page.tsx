import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session.server";
import { homePath } from "@/config/roles";
export default async function HomePage() {
    const user = await getSession();
    redirect(user ? homePath(user.role) : "/login");
}
