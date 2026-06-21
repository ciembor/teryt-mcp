import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

const expectedGuidance: Readonly<Record<string, readonly string[]>> = {
  resolve_address: ["locality", "street", "miejscowość", "ulica"],
  search_places: ["SIMC", "localities", "miejscowości", "search_units"],
  search_streets: ["ULIC", "resolve_address", "locality"],
  search_units: ["TERC", "województwa", "powiaty", "gminy", "search_places"],
  sync_database: ["SQLite", "missing", "synchronize"],
};

describe("tool intent metadata", () => {
  it("keeps TERC, SIMC, ULIC, address, and sync routing guidance in runtime descriptions", () => {
    const registry = createApp(createTestRuntimeConfig()).registry;

    for (const [toolName, phrases] of Object.entries(expectedGuidance)) {
      const description = registry.get(toolName)?.description ?? "";

      for (const phrase of phrases) {
        expect(description, `${toolName}: ${phrase}`).toContain(phrase);
      }
    }
  });
});

