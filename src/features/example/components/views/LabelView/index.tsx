"use client";
import { useState } from "react";
import { Alert, Button, Input, Space } from "antd";
import { useLabels } from "@/features/example/hooks/useLabels";
import { LabelTable } from "@/features/example/components/tables/LabelTable";
import { LabelForm } from "@/features/example/components/forms/LabelForm";
import type { Label, LabelInput } from "@/features/example/types/label.types";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDebounce } from "@/hooks/useDebounce";
import { useSession } from "@/providers/SessionProvider";
import { hasCapability } from "@/config/roles";
export function LabelView() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState<Label>();
    const [open, setOpen] = useState(false);
    const data = useLabels({ page, pageSize, search: useDebounce(search) });
    const canWrite = hasCapability(useSession()?.role, "example.write");
    return (
        <PageContainer
            title="Etiquetas"
            actions={
                canWrite && (
                    <Button
                        type="primary"
                        onClick={() => {
                            setSelected(undefined);
                            setOpen(true);
                        }}
                    >
                        Nueva etiqueta
                    </Button>
                )
            }
        >
            <Input.Search
                aria-label="Buscar etiquetas"
                placeholder="Buscar por nombre"
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                }}
                allowClear
            />
            {data.query.isError && (
                <Alert
                    type="error"
                    title="No se pudieron cargar las etiquetas"
                    action={<Button onClick={() => void data.query.refetch()}>Reintentar</Button>}
                />
            )}
            <LabelTable
                items={data.query.data?.items ?? []}
                loading={data.query.isFetching}
                pagination={data.query.data?.pagination}
                canWrite={canWrite}
                pending={data.deactivating}
                onEdit={(item) => {
                    setSelected(item);
                    setOpen(true);
                }}
                onDeactivate={data.deactivateLabel}
                onPage={(next, size) => {
                    setPage(next);
                    setPageSize(size);
                }}
            />
            {canWrite && (
                <FormDrawer<LabelInput>
                    key={selected?.id ?? "new"}
                    title={selected ? "Editar etiqueta" : "Nueva etiqueta"}
                    open={open}
                    initialValues={{ name: selected?.name ?? "" }}
                    pending={data.pending}
                    onClose={() => setOpen(false)}
                    onSubmit={(values) =>
                        selected ? data.updateLabel(selected.id, values) : data.createLabel(values)
                    }
                >
                    <Space orientation="vertical" style={{ width: "100%" }}>
                        <LabelForm />
                    </Space>
                </FormDrawer>
            )}
        </PageContainer>
    );
}
