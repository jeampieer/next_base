import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require.server";
import { SessionProvider } from "@/providers/SessionProvider";
import { LeftLayout } from "@/components/layout/LeftLayout";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { hasCapability } from "@/config/roles";
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
    const user = await requireAuth();
    const navigation = [
        { href: "/profile", label: "Mi perfil" },
        { href: "/labels", label: "Etiquetas" },
    ];
    if (hasCapability(user.role, "users.manage"))
        navigation.push({ href: "/users", label: "Usuarios" });
    return (
        <SessionProvider user={user}>
            <LeftLayout navigation={navigation} account={user.username} logout={<LogoutButton />}>
                {children}
            </LeftLayout>
        </SessionProvider>
    );
}
