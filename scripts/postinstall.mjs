import { access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const postinstallPath = resolve("dist/postinstall.js");

try {
  await access(postinstallPath);
  await import(pathToFileURL(postinstallPath).href);
} catch (error) {
  if (isMissingFile(error)) {
    process.stderr.write("teryt-mcp postinstall: dist/postinstall.js not found; skipping initial sync.\n");
  } else {
    throw error;
  }
}

function isMissingFile(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
