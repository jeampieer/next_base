import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores([".next/**", "coverage/**", "test-results/**", "next-env.d.ts"]),
    {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "no-restricted-imports": [
                "error",
                { patterns: [{ group: ["./*", "../*"], message: "Usa el alias @/." }] },
            ],
        },
    },
    {
        files: ["src/components/**/*.tsx", "src/features/**/components/**/*.tsx"],
        rules: {
            "no-restricted-syntax": [
                "error",
                { selector: "ExportDefaultDeclaration", message: "Usa named exports." },
            ],
        },
    },
]);
