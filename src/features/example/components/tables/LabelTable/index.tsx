"use client";
import { Button, Popconfirm, Space, Table } from "antd";
import type { Label } from "@/features/example/types/label.types";
import type { Pagination } from "@/types/api";
import { ActiveTag } from "@/components/ui/ActiveTag";
import { formatDate } from "@/lib/dayjs";
export function LabelTable({
    items,
    loading,
    pagination,
    canWrite,
    pending,
    onEdit,
    onDeactivate,
    onPage,
}: {
    items: Label[];
    loading: boolean;
    pagination?: Pagination;
    canWrite: boolean;
    pending: boolean;
    onEdit: (item: Label) => void;
    onDeactivate: (id: string) => Promise<unknown>;
    onPage: (page: number, pageSize: number) => void;
}) {
    return (
        <Table<Label>
            rowKey="id"
            size="small"
            loading={loading}
            dataSource={items}
            scroll={{ x: 650 }}
            locale={{ emptyText: "No hay etiquetas" }}
            pagination={{
                current: pagination?.page ?? 1,
                pageSize: pagination?.pageSize ?? 10,
                total: pagination?.total ?? 0,
                showSizeChanger: true,
                onChange: onPage,
            }}
            columns={[
                { title: "Nombre", dataIndex: "name" },
                { title: "Estado", render: (_, item) => <ActiveTag active={item.isActive} /> },
                { title: "Creación", render: (_, item) => formatDate(item.created) },
                ...(canWrite
                    ? [
                          {
                              title: "Acciones",
                              key: "actions",
                              fixed: "right" as const,
                              render: (_: unknown, item: Label) => (
                                  <Space>
                                      <Button size="small" onClick={() => onEdit(item)}>
                                          Editar
                                      </Button>
                                      {item.isActive && (
                                          <Popconfirm
                                              title="¿Desactivar esta etiqueta?"
                                              description="El registro se conservará."
                                              onConfirm={() => onDeactivate(item.id)}
                                              okText="Desactivar"
                                              cancelText="Cancelar"
                                          >
                                              <Button size="small" danger disabled={pending}>
                                                  Desactivar
                                              </Button>
                                          </Popconfirm>
                                      )}
                                  </Space>
                              ),
                          },
                      ]
                    : []),
            ]}
        />
    );
}
