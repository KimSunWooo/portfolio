import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";

const MAIN_CLASS = "com.project.backend_api.BackendApiApplication";

export type VerifyProcess = {
  pid: number;
  cwd: string;
  argv: string[];
};

function cmdline(pid: number): string[] {
  return fs.readFileSync(`/proc/${pid}/cmdline`).toString("utf8").split("\0").filter(Boolean);
}

function isVerifyBackend(argv: string[]): boolean {
  const joined = argv.join(" ");
  return argv.includes(MAIN_CLASS)
    && joined.includes("--spring.profiles.active=verify")
    && joined.includes("127.0.0.1:3307")
    && joined.includes("6380")
    && !joined.includes("rds.amazonaws.com");
}

export function findVerifyBackend(): VerifyProcess {
  const output = execFileSync("pgrep", ["-f", MAIN_CLASS], { encoding: "utf8" }).trim();
  const matches = output.split("\n").filter(Boolean).map((value) => {
    const pid = Number(value);
    const argv = cmdline(pid);
    const cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
    return { pid, cwd, argv };
  }).filter((process) => isVerifyBackend(process.argv));
  if (matches.length !== 1) {
    throw new Error(`expected one verify backend process, found ${matches.length}`);
  }
  return matches[0];
}

export async function waitForProductApi(expectUp: boolean, timeoutMs = 60_000): Promise<void> {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/products/1");
      last = `status ${response.status}`;
      if (expectUp && response.ok) {
        return;
      }
      if (!expectUp && !response.ok) {
        return;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : "connection failed";
      if (!expectUp) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`product API did not become ${expectUp ? "ready" : "unreachable"}: ${last}`);
}

export function stopVerifyBackend(target: VerifyProcess): void {
  processKill(target.pid);
}

function processKill(pid: number): void {
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ESRCH") {
      throw error;
    }
  }
}

export function startVerifyBackend(spec: VerifyProcess): void {
  const child = spawn(spec.argv[0], spec.argv.slice(1), {
    cwd: spec.cwd,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
