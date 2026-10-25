"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { IS_PRODUCTION } from "@/config/public";
export function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30000 } } })
    );
    return (
        <QueryClientProvider client={client}>
            {children}
            {!IS_PRODUCTION && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}
