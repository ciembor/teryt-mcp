import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        force: true,
        recursive: true,
      }),
    ),
  );
  tempDirs.length = 0;
});

describe("postinstall wrapper", () => {
  it("calls runPostinstallSync from the built postinstall module", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "teryt-postinstall-wrapper-"));
    tempDirs.push(tempDir);
    mkdirSync(join(tempDir, "dist"));
    writeFileSync(
      join(tempDir, "dist", "postinstall.js"),
      [
        "import { writeFileSync } from 'node:fs';",
        "export async function runPostinstallSync() {",
        "  writeFileSync('marker.txt', 'called');",
        "}",
      ].join("\n"),
    );

    const result = spawnSync(process.execPath, [resolve("scripts/postinstall.mjs")], {
      cwd: tempDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(readFileSync(join(tempDir, "marker.txt"), "utf8")).toBe("called");
  });
});
