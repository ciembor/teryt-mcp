import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "../..");
const tempRoot = await mkdtemp(join(tmpdir(), "teryt-npm-pack-smoke-"));

try {
  const packageDir = join(tempRoot, "package");
  const installDir = join(tempRoot, "install");
  const dataDir = join(tempRoot, "data");
  await Promise.all([mkdir(packageDir), mkdir(installDir), mkdir(dataDir)]);

  run("pnpm", ["pack", "--pack-destination", packageDir], { cwd: projectRoot });
  const tarballName = (await readdir(packageDir)).find((name) => name.endsWith(".tgz"));

  if (!tarballName) {
    throw new Error("npm pack smoke: package tarball was not created.");
  }

  run("npm", ["install", "--prefix", installDir, join(packageDir, tarballName)], {
    env: { TERYT_MCP_SKIP_POSTINSTALL_SYNC: "1" },
  });

  const executable = join(installDir, "node_modules", ".bin", "teryt-mcp");
  const env = { MCP_DATA_DIR: dataDir };
  const sync = runJson(executable, ["sync", "--force"], { env });
  assert(sync.status === "synced", "sync did not complete");
  assert(sync.datasets?.length === 4, "sync did not return four datasets");

  const status = runJson(executable, ["status"], { env });
  assert(status.database?.status === "available", "status did not report an available database");

  const search = runJson(executable, ["search", "places", "Kraków", "--limit", "1"], { env });
  assert(search.places?.[0]?.place?.name === "Kraków", "search did not return Kraków");

  await assertStdioRoundtrip(executable, env);
  process.stdout.write("npm pack smoke: passed\n");
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
  }

  return result.stdout;
}

function runJson(command, args, options) {
  return JSON.parse(run(command, args, { ...options, capture: true }));
}

async function assertStdioRoundtrip(executable, extraEnv) {
  const child = spawn(executable, ["serve"], {
    env: { ...process.env, ...extraEnv },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const responses = [];
  let buffer = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    responses.push(...lines.filter(Boolean).map((line) => JSON.parse(line)));
  });

  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "pack-smoke", version: "1" } },
  })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "health_status", arguments: {} },
  })}\n`);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "resolve_address", arguments: { query: "Wieliszew Marszałkowska", limit: 1 } },
  })}\n`);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "resolve_address", arguments: { query: "ul. Marszałkowskiej w Wieliszewie", limit: 1 } },
  })}\n`);

  await waitFor(() => responses.some((response) => response.id === 4));
  child.kill("SIGTERM");
  assert(responses.find((response) => response.id === 2)?.result?.structuredContent?.ok === true, "stdio health check failed");
  assertResolvedPlace(responses, 3, "Wieliszew");
  assertResolvedPlace(responses, 4, "Wieliszew");
}

function assertResolvedPlace(responses, id, placeName) {
  const actual = responses.find((response) => response.id === id)?.result?.structuredContent?.addresses?.[0]?.address?.place?.name;
  assert(actual === placeName, `resolve_address ${id} did not return ${placeName}`);
}

async function waitFor(predicate) {
  const deadline = Date.now() + 10_000;

  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error("npm pack smoke: timed out waiting for MCP response.");
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`npm pack smoke: ${message}.`);
  }
}
