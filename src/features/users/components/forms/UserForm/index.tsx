"use client";
import { Form, Input, Select } from "antd";
import { ROLE_OPTIONS } from "@/config/roles";
export function UserForm({ creating }: { creating: boolean }) {
    return (
        <>
            <Form.Item name="username" label="Usuario" rules={[{ required: true }, { max: 150 }]}>
                <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="email" label="Correo" rules={[{ required: true }, { type: "email" }]}>
                <Input />
            </Form.Item>
            <Form.Item name="firstName" label="Nombres" rules={[{ required: true }, { max: 150 }]}>
                <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Apellidos" rules={[{ required: true }, { max: 150 }]}>
                <Input />
            </Form.Item>
            {creating && (
                <>
                    <Form.Item name="password" label="Contraseña" rules={[{ required: true }]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="role" label="Rol">
                        <Select
                            options={ROLE_OPTIONS}
                            allowClear
                            placeholder="Predeterminado del backend"
                        />
                    </Form.Item>
                </>
            )}
        </>
    );
}
