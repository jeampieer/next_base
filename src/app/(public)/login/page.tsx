import { LoginView } from "@/features/auth/components/LoginView";
export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string }>;
}) {
    return <LoginView expired={(await searchParams).reason === "expired"} />;
}
