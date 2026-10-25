import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelView } from "@/features/example/components/views/LabelView";
import { UsersView } from "@/features/users/components/views/UsersView";
import { ProfileView } from "@/features/auth/components/ProfileView";
import { LoginView } from "@/features/auth/components/LoginView";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { LeftLayout } from "@/components/layout/LeftLayout";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { LabelForm } from "@/features/example/components/forms/LabelForm";
import { QueryProvider } from "@/providers/QueryProvider";
import { AntdConfigProvider } from "@/providers/AntdConfigProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useLabels } from "@/features/example/hooks/useLabels";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { loginAction, logoutAction } from "@/features/auth/actions/auth.actions";
import { QUERY_KEYS } from "@/lib/query";
import { createWrapper, identity, labelId, id } from "../fixtures";
import { installMemoryApi } from "../memory-api";
import { router } from "../setup";
vi.mock("@/features/auth/actions/auth.actions", () => ({
    loginAction: vi.fn(),
    logoutAction: vi.fn(async () => undefined),
    syncSessionAction: vi.fn(async () => undefined),
}));
beforeEach(() => installMemoryApi());
const dialog = () => within(screen.getByRole("dialog"));
describe("Label integrado con hook, service y Query", () => {
    it("valida, crea, edita, confirma desactivación e invalida", async () => {
        const state = installMemoryApi();
        const { Wrapper, client } = createWrapper();
        const invalidate = vi.spyOn(client, "invalidateQueries");
        const user = userEvent.setup();
        render(<LabelView />, { wrapper: Wrapper });
        expect(await screen.findByText("Etiqueta sintética")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Nueva etiqueta" }));
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await dialog().findByText("Ingresa un nombre")).toBeVisible();
        await user.type(dialog().getByLabelText("Nombre"), "Creada desde Drawer");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Creada desde Drawer")).toBeVisible();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        const row = screen.getByText("Creada desde Drawer").closest("tr");
        expect(row).not.toBeNull();
        if (!row) throw new Error("Falta fila creada");
        await user.click(within(row).getByRole("button", { name: "Editar" }));
        await user.clear(dialog().getByLabelText("Nombre"));
        await user.type(dialog().getByLabelText("Nombre"), "Editada");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Editada")).toBeVisible();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        const editedRow = screen.getByText("Editada").closest("tr");
        if (!editedRow) throw new Error("Falta fila editada");
        await user.click(within(editedRow).getByRole("button", { name: "Desactivar" }));
        expect(state.labels.find((label) => label.name === "Editada")?.is_active).toBe(true);
        await user.click(
            within(screen.getByRole("tooltip")).getByRole("button", { name: "Desactivar" })
        );
        await waitFor(() =>
            expect(state.labels.find((label) => label.name === "Editada")?.is_active).toBe(false)
        );
        expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.labels });
        expect(await screen.findByText("Inactivo")).toBeVisible();
    }, 15000);
    it("muestra error general y de campo sin cerrar el Drawer; permite corregir", async () => {
        const state = installMemoryApi();
        state.rejectWrite = true;
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(<LabelView />, { wrapper: Wrapper });
        await user.click(await screen.findByRole("button", { name: "Nueva etiqueta" }));
        await user.type(dialog().getByLabelText("Nombre"), "Duplicada");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await dialog().findByText("Nombre ocupado")).toBeVisible();
        expect(dialog().getByRole("alert")).toHaveTextContent("Operación rechazada");
        state.rejectWrite = false;
        await user.clear(dialog().getByLabelText("Nombre"));
        await user.type(dialog().getByLabelText("Nombre"), "Única");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Única")).toBeVisible();
    });
    it("restringe acciones por capacidad y muestra búsqueda vacía", async () => {
        const { Wrapper } = createWrapper({ ...identity, role: "MEMBER" });
        const user = userEvent.setup();
        render(<LabelView />, { wrapper: Wrapper });
        await screen.findByText("Etiqueta sintética");
        expect(screen.queryByRole("button", { name: "Nueva etiqueta" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Buscar etiquetas" }), "Ausente");
        expect(await screen.findByText("No hay etiquetas")).toBeVisible();
    });
    it("muestra error de consulta y puede reintentar", async () => {
        const state = installMemoryApi();
        state.failList = true;
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(<LabelView />, { wrapper: Wrapper });
        expect(await screen.findByText("No se pudieron cargar las etiquetas")).toBeVisible();
        state.failList = false;
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(await screen.findByText("Etiqueta sintética")).toBeVisible();
    });
});
describe("usuarios y perfil", () => {
    it("abre creación y edición en Drawer con campos distintos", async () => {
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(<UsersView />, { wrapper: Wrapper });
        await screen.findByText(identity.username);
        await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
        for (const [label, value] of [
            ["Usuario", "created"],
            ["Correo", "created@example.test"],
            ["Nombres", "Nuevo"],
            ["Apellidos", "Usuario"],
            ["Contraseña", "Fictional-9!Password"],
        ]) {
            await user.click(dialog().getByLabelText(label, { exact: true }));
            await user.paste(value);
        }
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Editar" }));
        expect(dialog().queryByLabelText("Contraseña", { exact: true })).not.toBeInTheDocument();
        await user.clear(dialog().getByLabelText("Nombres"));
        await user.type(dialog().getByLabelText("Nombres"), "Actualizado");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Actualizado Sintético")).toBeVisible();
    }, 15000);
    it("presenta rol, contraseña propia y confirmación de estado", async () => {
        const state = installMemoryApi();
        const { Wrapper } = createWrapper();
        const user = userEvent.setup({ delay: null });
        render(<UsersView />, { wrapper: Wrapper });
        await screen.findByText(identity.username);
        await user.click(screen.getByRole("button", { name: "Rol" }));
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Contraseña" }));
        await user.type(dialog().getByLabelText("Contraseña actual"), "old");
        await user.type(dialog().getByLabelText("Nueva contraseña"), "new");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Desactivar" }));
        await user.click(screen.getByRole("button", { name: "Confirmar" }));
        await waitFor(() =>
            expect(state.calls.some((call) => call.url?.endsWith("deactivate/"))).toBe(true)
        );
    });
    it("miembro puede consultar la lista sin controles de gestión", async () => {
        const { Wrapper } = createWrapper({ ...identity, role: "MEMBER" });
        render(<UsersView />, { wrapper: Wrapper });
        await screen.findByText(identity.username);
        expect(screen.queryByRole("button", { name: "Nuevo usuario" })).not.toBeInTheDocument();
    });
    it("edita perfil y cambia contraseña cerrando sesión", async () => {
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(<ProfileView />, { wrapper: Wrapper });
        await screen.findByText(identity.email);
        await user.click(screen.getByRole("button", { name: "Editar perfil" }));
        await user.clear(dialog().getByLabelText("Nombres"));
        await user.type(dialog().getByLabelText("Nombres"), "Perfil");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Perfil Sintético")).toBeVisible();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
        await user.type(dialog().getByLabelText("Contraseña actual"), "old");
        await user.type(dialog().getByLabelText("Nueva contraseña"), "new");
        await user.click(dialog().getByRole("button", { name: "Guardar" }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalled());
        expect(router.replace).toHaveBeenCalledWith("/login");
    });
});
describe("autenticación e infraestructura visual", () => {
    it("valida login, presenta errores y redirige sin exponer tokens", async () => {
        vi.mocked(loginAction)
            .mockResolvedValueOnce({
                success: false,
                message: "Credenciales inválidas",
                fields: { username: ["Usuario no válido"] },
            })
            .mockResolvedValueOnce({ success: true, data: { role: "MANAGER" } });
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(<LoginView expired />, { wrapper: Wrapper });
        expect(screen.getByText("La sesión ha caducado")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Ingresar" }));
        expect(await screen.findByText("Ingresa tu usuario")).toBeVisible();
        await user.type(screen.getByLabelText("Usuario", { exact: true }), "synthetic");
        await user.type(screen.getByLabelText("Contraseña", { exact: true }), "fictional");
        await user.click(screen.getByRole("button", { name: "Ingresar" }));
        expect(await screen.findByText("Usuario no válido")).toBeVisible();
        await user.clear(screen.getByLabelText("Usuario", { exact: true }));
        await user.type(screen.getByLabelText("Usuario", { exact: true }), "manager");
        await user.click(screen.getByRole("button", { name: "Ingresar" }));
        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/users"));
    });
    it("compone layout sin dependencias de features y abre navegación móvil", async () => {
        const { Wrapper } = createWrapper();
        const user = userEvent.setup();
        render(
            <LeftLayout
                navigation={[{ href: "/labels", label: "Etiquetas" }]}
                account="Cuenta sintética"
                logout={<LogoutButton />}
            >
                <p>Contenido</p>
            </LeftLayout>,
            { wrapper: Wrapper }
        );
        expect(screen.getByText("Contenido")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Abrir menú" }));
        expect(screen.getByRole("dialog")).toBeVisible();
        await user.click(dialog().getByRole("link", { name: "Etiquetas" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalled());
    });
    it("crea un QueryClient estable y desactiva envíos pendientes en Drawer", () => {
        const submit = vi.fn();
        render(
            <QueryProvider>
                <AntdConfigProvider>
                    <FormDrawer
                        title="Pendiente"
                        open
                        initialValues={{ name: "" }}
                        pending
                        onClose={vi.fn()}
                        onSubmit={submit}
                    >
                        <LabelForm />
                    </FormDrawer>
                </AntdConfigProvider>
            </QueryProvider>
        );
        expect(screen.getByLabelText("Nombre")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Guardar" })).toHaveClass("ant-btn-loading");
        expect(submit).not.toHaveBeenCalled();
    });
    it("debounce limpia temporizadores anteriores y aplica el último valor", () => {
        vi.useFakeTimers();
        try {
            const { result, rerender, unmount } = renderHook(
                ({ value }) => useDebounce(value, 100),
                { initialProps: { value: "a" } }
            );
            rerender({ value: "b" });
            rerender({ value: "c" });
            expect(result.current).toBe("a");
            act(() => vi.advanceTimersByTime(100));
            expect(result.current).toBe("c");
            unmount();
        } finally {
            vi.useRealTimers();
        }
    });
});
describe("errores e invalidaciones de hooks", () => {
    it("propaga errores de operaciones sin invalidar datos fallidos", async () => {
        const state = installMemoryApi();
        state.rejectWrite = true;
        const { Wrapper, client } = createWrapper();
        const invalidate = vi.spyOn(client, "invalidateQueries");
        const { result } = renderHook(() => useLabels({ page: 1, pageSize: 10 }), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
        await act(async () => {
            expect((await result.current.createLabel({ name: "x" })).success).toBe(false);
            expect((await result.current.updateLabel(labelId, { name: "x" })).success).toBe(false);
            expect((await result.current.deactivateLabel(labelId)).success).toBe(false);
        });
        expect(invalidate).not.toHaveBeenCalled();
    });
    it("estado y contraseñas de usuarios invalidan el listado", async () => {
        const { Wrapper, client } = createWrapper();
        const invalidate = vi.spyOn(client, "invalidateQueries");
        const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current.setState(id, true);
            await result.current.performAction(id, "password", { newPassword: "new" });
        });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.users });
    });
    it("un error del perfil conserva la sesión y permite reintentar", async () => {
        const state = installMemoryApi();
        state.rejectWrite = true;
        const { Wrapper } = createWrapper();
        const { result } = renderHook(useProfile, { wrapper: Wrapper });
        await act(async () => {
            expect(
                (
                    await result.current.updateProfile(id, {
                        email: "x@example.test",
                        firstName: "X",
                        lastName: "Y",
                    })
                ).success
            ).toBe(false);
        });
        expect(logoutAction).not.toHaveBeenCalled();
    });
});
