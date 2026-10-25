import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
        include: ["tests/unit/**/*.test.{ts,tsx}"],
        restoreMocks: true,
        clearMocks: true,
        testTimeout: 15000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            // Adaptadores Next y componentes de servidor: verificación mediante Playwright.
            exclude: [
                "src/app/layout.tsx",
                "src/app/page.tsx",
                "src/app/not-found.tsx",
                "src/app/(public)/login/page.tsx",
                "src/app/(protected)/layout.tsx",
                "src/app/(protected)/profile/page.tsx",
                "src/app/(protected)/users/page.tsx",
                "src/app/(protected)/labels/page.tsx",
                "src/app/api/auth/refresh/route.ts",
                "src/app/api/auth/logout/route.ts",
                "src/app/api/backend/[[]...path]/route.ts",
                "src/proxy.ts",
            ],
            reporter: ["text", "html", "json-summary", "lcov"],
            thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
        },
    },
});
