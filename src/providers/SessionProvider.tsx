"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Identity } from "@/lib/auth/types";
const SessionContext = createContext<Identity | null>(null);
export function SessionProvider({
    user,
    children,
}: {
    user: Identity | null;
    children: ReactNode;
}) {
    return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
export function useSession() {
    return useContext(SessionContext);
}
