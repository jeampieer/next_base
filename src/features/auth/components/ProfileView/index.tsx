"use client";
import { useState } from "react";
import { Alert, Button, Card, Descriptions, Form, Input, Space, Spin } from "antd";
import { useProfile } from "@/features/auth/hooks/useProfile";
import type { ProfileInput, PasswordInput } from "@/features/auth/types/auth.types";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { PageContainer } from "@/components/layout/PageContainer";
import { roleLabel } from "@/config/roles";
export function ProfileView() {
    const profile = useProfile();
    const [editing, setEditing] = useState(false);
    const [password, setPassword] = useState(false);
    const user = profile.query.data;
    if (profile.query.isError)
        return (
            <Alert
                type="error"
                title="No se pudo cargar el perfil"
                action={<Button onClick={() => void profile.query.refetch()}>Reintentar</Button>}
            />
        );
    if (!user) return <Spin aria-label="Cargando perfil" />;
    return (
        <PageContainer
            title="Mi perfil"
            actions={
                <Space>
                    <Button onClick={() => setEditing(true)}>Editar perfil</Button>
                    <Button onClick={() => setPassword(true)}>Cambiar contraseña</Button>
                </Space>
            }
        >
            <Card>
                <Descriptions
                    column={1}
                    items={[
                        { key: "username", label: "Usuario", children: user.username },
                        {
                            key: "name",
                            label: "Nombre",
                            children: `${user.firstName} ${user.lastName}`,
                        },
                        { key: "email", label: "Correo", children: user.email },
                        { key: "role", label: "Rol", children: roleLabel(user.role) },
                    ]}
                />
            </Card>
            <FormDrawer<ProfileInput>
                title="Editar perfil"
                open={editing}
                initialValues={user}
                pending={profile.updating}
                onClose={() => setEditing(false)}
                onSubmit={(values) => profile.updateProfile(user.id, values)}
            >
                <Form.Item
                    name="firstName"
                    label="Nombres"
                    rules={[{ required: true }, { max: 150 }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="lastName"
                    label="Apellidos"
                    rules={[{ required: true }, { max: 150 }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="email"
                    label="Correo"
                    rules={[{ required: true }, { type: "email" }]}
                >
                    <Input />
                </Form.Item>
            </FormDrawer>
            <FormDrawer<PasswordInput>
                title="Cambiar contraseña"
                open={password}
                initialValues={{ currentPassword: "", newPassword: "" }}
                pending={profile.changingPassword}
                onClose={() => setPassword(false)}
                onSubmit={profile.changePassword}
            >
                <Form.Item
                    name="currentPassword"
                    label="Contraseña actual"
                    rules={[{ required: true }]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Form.Item name="newPassword" label="Nueva contraseña" rules={[{ required: true }]}>
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
            </FormDrawer>
        </PageContainer>
    );
}
