import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { auditArchitecture } from "./architecture-lib.mjs";
const cases = [
    {
        name: "app compone vista",
        ok: true,
        files: {
            "app/page.ts": "export { x } from '@/features/fresh/components/A';",
            "features/fresh/components/A.ts": "export const x = 1;",
        },
    },
    {
        name: "app no llama services arbitrarios",
        ok: false,
        rule: "app-compose-through-components",
        files: {
            "app/page.ts": "export { x } from '@/features/fresh/services/value';",
            "features/fresh/services/value.ts": "export const x = 1;",
        },
    },
    {
        name: "feature nueva por alias",
        ok: true,
        files: {
            "features/fresh/components/A.ts":
                "import { value } from '@/features/fresh/hooks/value'; export const x = value;",
            "features/fresh/hooks/value.ts": "export const value = 1;",
        },
    },
    {
        name: "puente Server Action",
        ok: true,
        files: {
            "features/fresh/hooks/value.ts":
                "'use client'; import { action } from '@/features/fresh/actions/action'; export { action };",
            "features/fresh/actions/action.ts":
                "'use server'; import { value } from '@/lib/value.server'; export async function action() { return value; }",
            "lib/value.server.ts": "export const value = 1;",
        },
    },
    {
        name: "ciclo",
        ok: false,
        rule: "no-cycles",
        files: {
            "features/fresh/a.ts": "import { b } from './b'; export const a = () => b;",
            "features/fresh/b.ts": "import { a } from './a'; export const b = () => a;",
        },
    },
    {
        name: "tipos hacia UI",
        ok: false,
        rule: "pure-types-and-formatters",
        files: {
            "features/fresh/types/value.ts": "export { x } from '../components/A';",
            "features/fresh/components/A.ts": "export const x = 1;",
        },
    },
    {
        name: "formatter hacia transporte",
        ok: false,
        rule: "pure-types-and-formatters",
        files: {
            "features/fresh/utils/formatters/value.ts": "export { x } from '@/lib/api/client';",
            "lib/api/client.ts": "export const x = 1;",
        },
    },
    {
        name: "service hacia provider",
        ok: false,
        rule: "services-no-ui",
        files: {
            "features/fresh/services/value.ts": "export { x } from '@/providers/P';",
            "providers/P.ts": "export const x = 1;",
        },
    },
    {
        name: "componente hacia service",
        ok: false,
        rule: "components-through-hooks",
        files: {
            "features/fresh/components/A.ts": "export { x } from '../services/value';",
            "features/fresh/services/value.ts": "export const x = 1;",
        },
    },
    {
        name: "compartido hacia feature",
        ok: false,
        rule: "shared-no-features",
        files: {
            "lib/value.ts": "export { x } from '@/features/fresh/value';",
            "features/fresh/value.ts": "export const x = 1;",
        },
    },
    {
        name: "features independientes",
        ok: false,
        rule: "feature-fresh-independence",
        files: {
            "features/fresh/value.ts": "export { x } from '../other/value';",
            "features/other/value.ts": "export const x = 1;",
        },
    },
    {
        name: "cliente hacia servidor transitivo",
        ok: false,
        rule: "client-transitive-server",
        files: {
            "features/fresh/components/A.ts": "'use client'; export { x } from '@/lib/helper';",
            "lib/helper.ts": "export { x } from '@/lib/value.server';",
            "lib/value.server.ts": "export const x = 1;",
        },
    },
    {
        name: "servidor hacia cliente HTTP",
        ok: false,
        rule: "no-client-transport-on-server",
        files: {
            "features/fresh/services/value.server.ts": "export { x } from '@/lib/api/client';",
            "lib/api/client.ts": "export const x = 1;",
        },
    },
];
for (const item of cases) {
    const directory = mkdtempSync(join(tmpdir(), "next-base-architecture-"));
    try {
        for (const [file, content] of Object.entries(item.files)) {
            const absolute = resolve(directory, "src", file);
            mkdirSync(resolve(absolute, ".."), { recursive: true });
            writeFileSync(absolute, content);
        }
        copyFileSync(".dependency-cruiser.mjs", join(directory, ".dependency-cruiser.mjs"));
        writeFileSync(
            join(directory, "tsconfig.json"),
            JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } })
        );
        const result = auditArchitecture(directory);
        assert.equal(result.code, item.ok ? 0 : 1, `${item.name}: ${result.output}`);
        if (item.rule) assert.ok(result.output.includes(item.rule), result.output);
        console.log(`Correcto: ${item.name}`);
    } finally {
        assert.ok(
            resolve(directory).startsWith(
                resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/")
            )
        );
        rmSync(directory, { recursive: true, force: true });
    }
}
