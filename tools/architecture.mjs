import { auditArchitecture } from "./architecture-lib.mjs";
const result = auditArchitecture(process.cwd());
console.log(result.output);
process.exitCode = result.code;
