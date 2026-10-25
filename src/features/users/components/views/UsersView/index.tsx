"use client";
import { useState } from "react";
import { Alert, Button, Form, Input, Popconfirm, Select, Space, Table } from "antd";
import { useUsers } from "@/features/users/hooks/useUsers";
import { UserForm } from "@/features/users/components/forms/UserForm";
import type {
    User,
    UserInput,
    UserAction,
    UserActionInput,
} from "@/features/users/types/user.types";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActiveTag } from "@/components/ui/ActiveTag";
import { useSession } from "@/providers/SessionProvider";
import { hasCapability, ROLE_OPTIONS, roleLabel } from "@/config/roles";
import { useDebounce } from "@/hooks/useDebounce";
export function UsersView() {
    const user = useSession();
    const canManage = hasCapability(user?.role, "users.manage");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState<User>();
    const [open, setOpen] = useState(false);
    const [action, setAction] = useState<{ user: User; name: UserAction }>();
    const data = useUsers({ page, pageSize, search: useDebounce(search) });
    return (
        <PageContainer
            title="Usuarios"
            actions={
                canManage && (
                    <Button
                        type="primary"
                        onClick={() => {
                            setSelected(undefined);
                            setOpen(true);
                        }}
                    >
                        Nuevo usuario
                    </Button>
                )
            }
        >
            <Input.Search
                aria-label="Buscar usuarios"
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                }}
                placeholder="Buscar usuarios"
                allowClear
            />
            {data.query.isError && (
                <Alert
                    type="error"
                    title="No se pudieron cargar los usuarios"
                    action={<Button onClick={() => void data.query.refetch()}>Reintentar</Button>}
                />
            )}
            <Table<User>
                rowKey="id"
                size="small"
                dataSource={data.query.data?.items ?? []}
                loading={data.query.isFetching}
                scroll={{ x: 1000 }}
                locale={{ emptyText: "No hay usuarios" }}
                pagination={{
                    current: page,
                    pageSize,
                    total: data.query.data?.pagination.total ?? 0,
                    showSizeChanger: true,
                    onChange: (next, size) => {
                        setPage(next);
                        setPageSize(size);
                    },
                }}
                columns={[
                    { title: "Usuario", dataIndex: "username" },
                    { title: "Nombres", render: (_, item) => `${item.firstName} ${item.lastName}` },
                    { title: "Correo", dataIndex: "email" },
                    { title: "Rol", render: (_, item) => roleLabel(item.role) },
                    { title: "Estado", render: (_, item) => <ActiveTag active={item.isActive} /> },
                    ...(canManage
                        ? [
                              {
                                  title: "Acciones",
                                  fixed: "right" as const,
                                  render: (_: unknown, item: User) => (
                                      <Space wrap>
                                          <Button
                                              size="small"
                                              onClick={() => {
                                                  setSelected(item);
                                                  setOpen(true);
                                              }}
                                          >
                                              Editar
                                          </Button>
                                          <Button
                                              size="small"
                                              onClick={() =>
                                                  setAction({ user: item, name: "role" })
                                              }
                                          >
                                              Rol
                                          </Button>
                                          <Button
                                              size="small"
                                              onClick={() =>
                                                  setAction({ user: item, name: "password" })
                                              }
                                          >
                                              Contraseña
                                          </Button>
                                          <Popconfirm
                                              title={
                                                  item.isActive
                                                      ? "¿Desactivar usuario?"
                                                      : "¿Activar usuario?"
                                              }
                                              description="La autorización se comprobará en el servidor."
                                              onConfirm={() =>
                                                  data.setState(item.id, !item.isActive)
                                              }
                                              okText="Confirmar"
                                              cancelText="Cancelar"
                                          >
                                              <Button
                                                  size="small"
                                                  danger={item.isActive}
                                                  disabled={data.pending}
                                              >
                                                  {item.isActive ? "Desactivar" : "Activar"}
                                              </Button>
                                          </Popconfirm>
                                      </Space>
                                  ),
                              },
                          ]
                        : []),
                ]}
            />
            {canManage && (
                <FormDrawer<UserInput>
                    key={selected?.id ?? "new"}
                    title={selected ? "Editar usuario" : "Nuevo usuario"}
                    open={open}
                    initialValues={
                        selected ?? { username: "", email: "", firstName: "", lastName: "" }
                    }
                    pending={data.pending}
                    onClose={() => setOpen(false)}
                    onSubmit={(values) => data.saveUser(values, selected?.id)}
                >
                    <UserForm creating={!selected} />
                </FormDrawer>
            )}
            {canManage && action && (
                <FormDrawer<UserActionInput>
                    key={`${action.user.id}-${action.name}`}
                    title={action.name === "role" ? "Cambiar rol" : "Cambiar contraseña"}
                    open
                    initialValues={{ role: action.user.role }}
                    pending={data.pending}
                    onClose={() => setAction(undefined)}
                    onSubmit={(values) => data.performAction(action.user.id, action.name, values)}
                >
                    {action.name === "role" ? (
                        <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
                            <Select options={ROLE_OPTIONS} />
                        </Form.Item>
                    ) : (
                        <>
                            {action.user.id === user?.id && (
                                <Form.Item
                                    name="currentPassword"
                                    label="Contraseña actual"
                                    rules={[{ required: true }]}
                                >
                                    <Input.Password autoComplete="current-password" />
                                </Form.Item>
                            )}
                            <Form.Item
                                name="newPassword"
                                label="Nueva contraseña"
                                rules={[{ required: true }]}
                            >
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                        </>
                    )}
                </FormDrawer>
            )}
        </PageContainer>
    );
}
