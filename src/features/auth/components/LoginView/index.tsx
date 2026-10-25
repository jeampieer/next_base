"use client";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { LoginInput } from "@/features/auth/types/auth.types";
export function LoginView({ expired = false }: { expired?: boolean }) {
    const { login, pending } = useAuth();
    const [form] = Form.useForm<LoginInput>();
    return (
        <Card style={{ maxWidth: 420, margin: "10vh auto" }}>
            <Typography.Title level={1}>Iniciar sesión</Typography.Title>
            {expired && <Alert title="La sesión ha caducado" type="info" />}
            <Form
                form={form}
                layout="vertical"
                onFinish={async (values) => {
                    const result = await login(values);
                    if (!result.success)
                        form.setFields(
                            Object.entries(result.fields).flatMap(([name, errors]) =>
                                name === "username" || name === "password" ? [{ name, errors }] : []
                            )
                        );
                }}
            >
                <Form.Item
                    name="username"
                    label="Usuario"
                    rules={[{ required: true, message: "Ingresa tu usuario" }]}
                >
                    <Input autoComplete="username" />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="Contraseña"
                    rules={[{ required: true, message: "Ingresa tu contraseña" }]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Button htmlType="submit" type="primary" block loading={pending}>
                    Ingresar
                </Button>
            </Form>
        </Card>
    );
}
