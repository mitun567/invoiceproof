const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(envPath);

if (!process.env.DATABASE_URL) {
  console.error("[invoiceproof] DATABASE_URL is missing in .env");
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);
if (!prismaArgs.length) {
  console.error(
    "[invoiceproof] Missing Prisma arguments. Example: node scripts/run-prisma-with-env.cjs db push"
  );
  process.exit(1);
}

const result = spawnSync(
  "npm",
  ["--workspace", "packages/db", "exec", "prisma", ...prismaArgs],
  {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  }
);

if (result.error) {
  console.error(
    "[invoiceproof] Failed to run Prisma command.",
    result.error.message
  );
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
