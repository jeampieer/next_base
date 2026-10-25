"use client";
import { Button } from "antd";
import { useAuth } from "@/features/auth/hooks/useAuth";
export function LogoutButton() {
    const { logout, pending } = useAuth();
    return (
        <Button onClick={() => void logout()} loading={pending}>
            Cerrar sesión
        </Button>
    );
}
