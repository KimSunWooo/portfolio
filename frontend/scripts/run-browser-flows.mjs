import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainClass = "com.project.backend_api.BackendApiApplication";

function fail(stage, detail) {
  console.error(`[browser-flows] ${stage}: ${detail}`);
  process.exit(1);
}

async function waitUntil(stage, probe, timeoutMs = 60_000) {
  const started = Date.now();
  let last = "no response";
  while (Date.now() - started < timeoutMs) {
    try {
      const result = await probe();
      if (result === true) {
        return;
      }
      last = String(result);
    } catch (error) {
      last = error instanceof Error ? error.message : "probe failed";
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  fail(stage, last);
}

function verifyBackendCommand() {
  let output = "";
  try {
    output = execFileSync("pgrep", ["-f", mainClass], { encoding: "utf8" }).trim();
  } catch {
    fail("backend", "verify backend process is not running");
  }
  const matches = output.split("\n").filter(Boolean).filter((pid) => {
    const command = fs.readFileSync(`/proc/${pid}/cmdline`).toString("utf8");
    return command.includes("--spring.profiles.active=verify")
      && command.includes("127.0.0.1:3307")
      && command.includes("6380")
      && !command.includes("rds.amazonaws.com");
  });
  if (matches.length !== 1) {
    fail("backend", `expected one verify-profile backend, found ${matches.length}`);
  }
}

function containerRunning(name) {
  const status = execFileSync("docker", [
    "inspect",
    name,
    "--format",
    "{{.State.Status}}",
  ], { encoding: "utf8" }).trim();
  if (status !== "running") {
    fail("containers", `${name} is ${status}`);
  }
}

containerRunning("portfolio-verify-mysql");
containerRunning("portfolio-verify-redis");
verifyBackendCommand();

await waitUntil("mysql", async () => {
  execFileSync("docker", [
    "exec",
    "portfolio-verify-mysql",
    "mysqladmin",
    "ping",
    "-uroot",
    "-pverify-db",
    "--silent",
  ], { stdio: "ignore" });
  return true;
});

await waitUntil("redis", async () => {
  const pong = execFileSync("docker", [
    "exec",
    "portfolio-verify-redis",
    "redis-cli",
    "PING",
  ], { encoding: "utf8" }).trim();
  return pong === "PONG" ? true : pong;
});

await waitUntil("backend-http", async () => {
  const response = await fetch("http://127.0.0.1:8080/api/products/1");
  return response.ok ? true : `status ${response.status}`;
});

await waitUntil("frontend-http", async () => {
  const response = await fetch("http://127.0.0.1:3000/login");
  return response.ok ? true : `status ${response.status}`;
});

const child = spawn("npx", ["playwright", "test", "--repeat-each=2"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const exitCode = await new Promise((resolve) => {
  child.on("exit", (code) => resolve(code ?? 1));
});
process.exit(exitCode);
