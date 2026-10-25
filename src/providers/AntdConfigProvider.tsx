"use client";
import { App, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import type { ReactNode } from "react";
export function AntdConfigProvider({ children }: { children: ReactNode }) {
    return (
        <ConfigProvider locale={esES} theme={{ token: { colorPrimary: "#1677ff" } }}>
            <App>{children}</App>
        </ConfigProvider>
    );
}
