"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Drawer, Form } from "antd";
import type { OperationResult } from "@/types/api";
export function FormDrawer<T extends object>({
    title,
    open,
    initialValues,
    pending,
    onClose,
    onSubmit,
    children,
}: {
    title: string;
    open: boolean;
    initialValues: T;
    pending: boolean;
    onClose: () => void;
    onSubmit: (values: T) => Promise<OperationResult<unknown>>;
    children: ReactNode;
}) {
    const [form] = Form.useForm<T>();
    const [error, setError] = useState<string>();
    useEffect(() => {
        if (open) form.resetFields();
    }, [open, form]);
    return (
        <Drawer
            title={title}
            open={open}
            onClose={() => {
                if (!pending) {
                    setError(undefined);
                    onClose();
                }
            }}
            forceRender
            extra={
                <Button
                    aria-label="Guardar"
                    type="primary"
                    loading={pending}
                    onClick={() => form.submit()}
                >
                    Guardar
                </Button>
            }
        >
            {error && <Alert title={error} type="error" />}
            <Form
                form={form}
                initialValues={initialValues}
                layout="vertical"
                disabled={pending}
                onFinish={async (values) => {
                    const result = await onSubmit(values);
                    if (result.success) {
                        setError(undefined);
                        onClose();
                    } else {
                        setError(result.message);
                        // Nombres dinámicos del contrato de errores, ya convertidos a camelCase.
                        // Ant Design acepta esos paths en ejecución; T no permite enumerarlos estáticamente.
                        const fields = Object.entries(result.fields).map(([name, errors]) => ({
                            name,
                            errors,
                        })) as Parameters<typeof form.setFields>[0];
                        form.setFields(fields);
                    }
                }}
            >
                {children}
            </Form>
        </Drawer>
    );
}
