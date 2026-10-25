import { Flex, Typography, Space } from "antd";
import type { ReactNode } from "react";
export function PageContainer({
    title,
    actions,
    children,
}: {
    title: string;
    actions?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <Flex justify="space-between" align="center" wrap gap="small">
                <Typography.Title level={2}>{title}</Typography.Title>
                {actions}
            </Flex>
            {children}
        </Space>
    );
}
