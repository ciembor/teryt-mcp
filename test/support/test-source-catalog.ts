import { EterytSourceCatalog } from "../../src/features/source-status/infrastructure/eteryt-source-catalog.js";

export function createTestSourceCatalog(status = 200): EterytSourceCatalog {
  return new EterytSourceCatalog(
    async () => new Response("fixture", { status }),
    () => new Date("2026-01-01T00:00:00.000Z"),
  );
}
