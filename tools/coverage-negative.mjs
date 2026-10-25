import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const binary = fileURLToPath(new URL("./vitest.mjs", import.meta.resolve("vitest/package.json")));
// Misma configuración y umbral: solo se reduce la selección de tests.
const result = spawnSync(
    process.execPath,
    [binary, "run", "tests/unit/core.test.ts", "--coverage"],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }
);
const output = result.stdout + result.stderr;
assert.notEqual(result.status, 0, "Una suite parcial no debe satisfacer la cobertura global.");
assert.match(output, /Coverage for .* does not meet/i);
console.log(output);
console.log("Control negativo correcto: cobertura insuficiente rechazada sin cambiar umbrales.");
