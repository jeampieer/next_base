import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
export const cruiseBin = fileURLToPath(
    new URL("../../bin/dependency-cruise.mjs", import.meta.resolve("dependency-cruiser"))
);
export function auditArchitecture(cwd) {
    const run = spawnSync(
        process.execPath,
        [cruiseBin, "src", "--config", ".dependency-cruiser.mjs", "--output-type", "json"],
        { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
    );
    if (!run.stdout)
        return { code: 1, output: run.stderr || "No se pudo ejecutar dependency-cruiser." };
    let graph;
    try {
        graph = JSON.parse(run.stdout);
    } catch {
        return { code: 1, output: run.stdout + run.stderr };
    }
    const violations = graph.summary.violations.map(
        (item) => `${item.rule.name}: ${item.from} → ${item.to}`
    );
    const modules = new Map(graph.modules.map((item) => [item.source, item]));
    const contents = (file) => readFileSync(resolve(cwd, file), "utf8");
    // Recorrido transitivo; una Server Action es un puente válido.
    for (const root of graph.modules.filter(
        (item) =>
            item.source.startsWith("src/") &&
            /\.[jt]sx?$/.test(item.source) &&
            /^\s*["']use client["']/.test(contents(item.source))
    )) {
        const seen = new Set();
        function visit(file) {
            if (seen.has(file)) return;
            seen.add(file);
            const entry = modules.get(file);
            if (!entry || !file.startsWith("src/")) return;
            if (/^\s*["']use server["']/.test(contents(file))) return;
            if (/\.server\.[jt]s$/.test(file) || file === "src/lib/api/server.ts") {
                violations.push(`client-transitive-server: ${root.source} → ${file}`);
                return;
            }
            for (const dependency of entry.dependencies) {
                if (dependency.dependencyTypes?.includes("type-only")) continue;
                if (/^next\/(headers|server)$/.test(dependency.module))
                    violations.push(`client-transitive-next-server: ${root.source} → ${file}`);
                visit(dependency.resolved);
            }
        }
        visit(root.source);
    }
    return {
        code: violations.length ? 1 : (run.status ?? 1),
        output: violations.length
            ? violations.join("\n")
            : `Arquitectura válida: ${graph.modules.length} módulos; sin ciclos ni límites rotos.`,
    };
}
