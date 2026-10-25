import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "@/config/public";
import { QueryProvider } from "@/providers/QueryProvider";
import { AntdConfigProvider } from "@/providers/AntdConfigProvider";
import "@/app/globals.css";
export const metadata: Metadata = {
    title: APP_NAME,
    description: "Plantilla de panel administrativo",
};
export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            <body>
                <QueryProvider>
                    <AntdConfigProvider>{children}</AntdConfigProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
