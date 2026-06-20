import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

describe("app", () => {
  it("creates an MCP app", () => {
    const app = createApp(createTestRuntimeConfig());

    expect(app.registry.get("get_place")).toBeDefined();
    expect(app.registry.get("get_street")).toBeDefined();
    expect(app.registry.get("get_unit")).toBeDefined();
    expect(app.registry.get("health_status")).toBeDefined();
    expect(app.registry.get("resolve_address")).toBeDefined();
    expect(app.registry.get("search_places")).toBeDefined();
    expect(app.registry.get("search_streets")).toBeDefined();
    expect(app.registry.get("search_units")).toBeDefined();
    expect(app.registry.get("server_status")).toBeDefined();
    expect(app.registry.get("source_status")).toBeDefined();
    expect(app.registry.get("sync_database")).toBeDefined();
  });
});
