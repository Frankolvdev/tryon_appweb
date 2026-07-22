import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = [
  "package.json",
  "next.config.ts",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/lib/api.ts",
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error(`Faltan archivos esenciales:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["lint", "build"]) {
  if (!pkg.scripts?.[script]) {
    console.error(`Falta el script npm '${script}'.`);
    process.exit(1);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[1/3] Estructura AppWeb: OK");
console.log("[2/3] ESLint");
run("npm", ["run", "lint"]);
console.log("[3/3] Build de producción");
run("npm", ["run", "build"]);
console.log("AppWeb listo para entrega.");
