// Sincronizar manualmente con USER_ROLES. No representa privilegios de superusuario.
export const ROLE_CATALOG = {
    MANAGER: {
        label: "Gestor (ejemplo)",
        level: 10,
        capabilities: ["users.manage", "example.write"],
    },
    MEMBER: { label: "Miembro (ejemplo)", level: 20, capabilities: [] },
} as const;
export type Role = keyof typeof ROLE_CATALOG;
export type Capability = (typeof ROLE_CATALOG)[Role]["capabilities"][number];
export function isConfiguredRole(role: string): role is Role {
    return Object.hasOwn(ROLE_CATALOG, role);
}
export function hasCapability(role: string | undefined, capability: Capability): boolean {
    if (!role || !isConfiguredRole(role)) return false;
    return (ROLE_CATALOG[role].capabilities as readonly string[]).includes(capability);
}
export function roleLabel(role: string): string {
    return isConfiguredRole(role) ? ROLE_CATALOG[role].label : role;
}
export const ROLE_OPTIONS = Object.entries(ROLE_CATALOG).map(([value, role]) => ({
    value,
    label: role.label,
}));
export function homePath(role: string): string {
    return hasCapability(role, "users.manage") ? "/users" : "/profile";
}
