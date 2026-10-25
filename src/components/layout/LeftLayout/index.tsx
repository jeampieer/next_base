"use client";
import { Layout, Menu, Typography, Button, Drawer, Flex } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/config/public";
import styles from "@/components/layout/LeftLayout/styles.module.css";
export interface NavigationItem {
    href: string;
    label: string;
}
export function LeftLayout({
    children,
    navigation,
    account,
    logout,
}: {
    children: ReactNode;
    navigation: NavigationItem[];
    account: string;
    logout: ReactNode;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const menu = (
        <Menu
            selectedKeys={[pathname]}
            items={navigation.map((item) => ({
                key: item.href,
                label: (
                    <Link href={item.href} onClick={() => setOpen(false)}>
                        {item.label}
                    </Link>
                ),
            }))}
        />
    );
    return (
        <Layout className={styles.shell}>
            <Layout.Sider className={styles.sidebar} theme="light" width={220}>
                <Typography.Title level={4} className={styles.title}>
                    {APP_NAME}
                </Typography.Title>
                {menu}
            </Layout.Sider>
            <Layout>
                <Layout.Header className={styles.header}>
                    <Flex align="center" justify="space-between">
                        <Button
                            aria-label="Abrir menú"
                            className={styles.mobileMenu}
                            icon={<MenuOutlined />}
                            onClick={() => setOpen(true)}
                        />
                        <Typography.Text>{account}</Typography.Text>
                        {logout}
                    </Flex>
                </Layout.Header>
                <Layout.Content className={styles.content}>{children}</Layout.Content>
            </Layout>
            <Drawer title={APP_NAME} open={open} onClose={() => setOpen(false)} placement="left">
                {menu}
            </Drawer>
        </Layout>
    );
}
