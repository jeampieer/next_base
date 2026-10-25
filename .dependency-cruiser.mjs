import fs from "node:fs";
import path from "node:path";
function walk(dir) {
    return fs.existsSync(dir)
        ? fs
              .readdirSync(dir, { withFileTypes: true })
              .flatMap((entry) =>
                  entry.isDirectory()
                      ? walk(path.join(dir, entry.name))
                      : [path.join(dir, entry.name).replaceAll("\\", "/")]
              )
        : [];
}
const files = walk("src");
const clientRoots = files.filter(
    (file) =>
        /\.[jt]sx?$/.test(file) && /^\s*["']use client["']/.test(fs.readFileSync(file, "utf8"))
);
const features = fs
    .readdirSync("src/features", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
const config = {
    forbidden: [
        { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
        { name: "no-unresolved", severity: "error", from: {}, to: { couldNotResolve: true } },
        {
            name: "pure-types-and-formatters",
            severity: "error",
            from: { path: "(?:/types/|/utils/formatters/|/formatter\\.ts$)" },
            to: {
                path: "(?:/components/|/hooks/|/providers/|/services/|lib/api/(?:client|server)|node_modules/(?:react|antd|axios|next))",
            },
        },
        {
            name: "services-no-ui",
            severity: "error",
            from: { path: "/services/" },
            to: { path: "(?:/components/|/hooks/|/providers/|node_modules/(?:react|antd))" },
        },
        {
            name: "components-through-hooks",
            severity: "error",
            from: { path: "^src/features/[^/]+/components/" },
            to: {
                path: "(?:/services/|/utils/formatters/|lib/api/(?:client|server)|node_modules/axios)",
            },
        },
        {
            name: "shared-no-features",
            severity: "error",
            from: { path: "^src/(?:components|lib|providers|hooks|config|types)/" },
            to: { path: "^src/features/" },
        },
        {
            name: "app-compose-through-components",
            severity: "error",
            from: {
                path: "^src/app/",
                pathNot: "^src/app/api/auth/(?:refresh|logout)/route\\.ts$",
            },
            to: { path: "^src/features/[^/]+/(?:services|server|hooks|utils)/" },
        },
        {
            name: "auth-routes-specific-adapter",
            severity: "error",
            from: { path: "^src/app/api/auth/" },
            to: {
                path: "^src/features/",
                pathNot: "^src/features/auth/server/session\\.server\\.ts$",
            },
        },
        {
            name: "proxy-specific-auth-service",
            severity: "error",
            from: { path: "^src/proxy\\.ts$" },
            to: {
                path: "^src/features/",
                pathNot: "^src/features/auth/services/auth\\.server\\.ts$",
            },
        },
        ...features.map((feature) => ({
            name: `feature-${feature}-independence`,
            severity: "error",
            from: { path: `^src/features/${feature}/` },
            to: { path: "^src/features/", pathNot: `^src/features/${feature}/` },
        })),
        {
            name: "client-no-server",
            severity: "error",
            from: {
                path: `^(?:${clientRoots.map((file) => file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`,
            },
            to: { path: "(?:\\.server\\.[jt]s$|node_modules/next/(?:headers|server))" },
        },
        {
            name: "no-client-transport-on-server",
            severity: "error",
            from: { path: "(?:\\.server\\.[jt]s$|^src/proxy\\.ts$|^src/app/api/)" },
            to: { path: "^src/lib/api/client\\.ts$" },
        },
        {
            name: "server-actions-only-client-bridge",
            severity: "error",
            from: { path: "^src/features/[^/]+/(?:hooks|components)/" },
            to: { path: "(?:/server/|\\.server\\.[jt]s$)" },
        },
    ],
    options: {
        doNotFollow: { path: "node_modules" },
        tsPreCompilationDeps: true,
        tsConfig: { fileName: "tsconfig.json" },
        enhancedResolveOptions: {
            extensions: [".ts", ".tsx", ".js", ".json", ".css"],
            conditionNames: ["import", "require", "node", "default"],
        },
    },
};
export default config;
