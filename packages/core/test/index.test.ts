import { describe, expect, it } from "vitest";

import {
  assertValidRegistry,
  assertCleanArchitectureLayers,
  assertFeatureBoundaries,
  assertMcpAnnotations,
  assertNoDependencyCycles,
  assertToolSchemas,
  callTool,
  createCapabilityRegistry,
  createMcpApp,
  createTestApp,
  defineFeature,
  definePrompt,
  defineResource,
  defineTool,
  validateRegistry,
  type CapabilityRegistry,
} from "../src/index";

const limitInputSchema = {
  type: "object",
  properties: {
    limit: {
      type: "number",
      minimum: 1,
    },
  },
  required: ["limit"],
};

describe("@mcp-kit/core", () => {
  it("defines and registers capabilities in deterministic order", () => {
    const registry = createCapabilityRegistry([
      defineResource({
        name: "registry_status",
        uriTemplate: "status://registry",
        annotations: {
          readOnlyHint: true,
        },
      }),
      defineTool({
        name: "list_places",
        policy: "read",
        inputSchema: limitInputSchema,
        annotations: {
          readOnlyHint: true,
        },
        handler: () => ({ content: [] }),
      }),
      definePrompt({
        name: "address_help",
        annotations: {
          readOnlyHint: true,
        },
      }),
    ]);

    expect(registry.capabilities.map((capability) => capability.name)).toEqual([
      "address_help",
      "list_places",
      "registry_status",
    ]);
    expect(registry.tools()).toHaveLength(1);
    expect(registry.resources()).toHaveLength(1);
    expect(registry.prompts()).toHaveLength(1);
  });

  it("creates an MCP app from a valid registry", () => {
    const registry = createCapabilityRegistry([]);
    const app = createMcpApp({
      name: "teryt-mcp",
      version: "0.0.0",
      registry,
    });

    expect(app.name).toBe("teryt-mcp");
    expect(app.registry).toBe(registry);
  });

  it("calls registered tool handlers through the test helper", async () => {
    const app = createTestApp([
      defineTool<{ value: string }, { value: string }>({
        name: "echo_value",
        policy: "read",
        outputSchema: {
          type: "object",
          properties: {
            value: {
              type: "string",
            },
          },
          required: ["value"],
        },
        returnsStructuredContent: true,
        annotations: {
          readOnlyHint: true,
        },
        handler: (input) => ({
          structuredContent: {
            value: input.value,
          },
        }),
      }),
    ]);

    await expect(callTool(app, "echo_value", { value: "TERYT" })).resolves.toEqual({
      structuredContent: {
        value: "TERYT",
      },
    });
  });

  it("defines feature capabilities through a sorted public boundary", () => {
    const feature = defineFeature({
      name: "health",
      capabilities: [
        defineTool({
          name: "health_status",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
        defineTool({
          name: "health_details",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ],
    });

    expect(feature.capabilities.map((capability) => capability.name)).toEqual([
      "health_details",
      "health_status",
    ]);
  });

  it("rejects duplicate names", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "health_status",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
        definePrompt({
          name: "health_status",
          annotations: {
            readOnlyHint: true,
          },
        }),
      ]),
    ).toThrow(/duplicated/);
  });

  it("rejects invalid naming convention", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "HealthStatus",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/snake_case/);
  });

  it("rejects unsorted registries when asserted directly", () => {
    const registry: CapabilityRegistry = {
      capabilities: [
        defineTool({
          name: "z_tool",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
        defineTool({
          name: "a_tool",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ],
      get: () => undefined,
      tools: () => [],
      resources: () => [],
      prompts: () => [],
    };

    expect(validateRegistry(registry)).toContain("Capability registry must be sorted deterministically by name and kind.");
    expect(() => assertValidRegistry(registry)).toThrow(/sorted deterministically/);
  });

  it("rejects structured tool results without an output schema", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "health_status",
          policy: "read",
          returnsStructuredContent: true,
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({
            structuredContent: {
              ok: true,
            },
          }),
        }),
      ]),
    ).toThrow(/outputSchema/);
  });

  it("rejects list and search tools without limit input", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "list_places",
          policy: "read",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/limit/);

    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "search_places",
          policy: "read",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
              },
            },
          },
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/limit/);
  });

  it("rejects inconsistent read and write annotations", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "read_status",
          policy: "read",
          annotations: {
            readOnlyHint: false,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/readOnlyHint/);

    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "sync_data",
          policy: "write",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/write-capable/);
  });

  it("exposes focused architecture assertions for registries", () => {
    const registry = createCapabilityRegistry([
      defineTool({
        name: "health_status",
        policy: "read",
        outputSchema: {
          type: "object",
        },
        returnsStructuredContent: true,
        annotations: {
          readOnlyHint: true,
        },
        handler: () => ({
          structuredContent: {
            ok: true,
          },
        }),
      }),
    ]);

    expect(() => assertMcpAnnotations(registry)).not.toThrow();
    expect(() => assertToolSchemas(registry)).not.toThrow();
  });

  it("detects dependency cycles between source files", () => {
    expect(() =>
      assertNoDependencyCycles([
        {
          path: "src/a.ts",
          content: 'import { b } from "./b";\nexport const a = b;',
        },
        {
          path: "src/b.ts",
          content: 'import { a } from "./a";\nexport const b = a;',
        },
      ]),
    ).toThrow(/Dependency cycles/);
  });

  it("detects clean architecture layer violations", () => {
    expect(() =>
      assertCleanArchitectureLayers([
        {
          path: "src/features/health/application/get-health.ts",
          content: 'import { healthTool } from "../mcp/health.tool";',
        },
        {
          path: "src/features/health/mcp/health.tool.ts",
          content: 'import { store } from "../infrastructure/store";',
        },
        {
          path: "src/features/health/domain/health.ts",
          content: 'import { Server } from "@modelcontextprotocol/sdk/server";',
        },
      ]),
    ).toThrow(/Clean architecture violations/);
  });

  it("detects cross-feature imports that skip index boundaries", () => {
    expect(() =>
      assertFeatureBoundaries([
        {
          path: "src/features/address/application/get-address.ts",
          content: 'import { getHealth } from "../../health/application/get-health";',
        },
      ]),
    ).toThrow(/Feature boundary violations/);
  });

  it("allows cross-feature imports through feature indexes", () => {
    expect(() =>
      assertFeatureBoundaries([
        {
          path: "src/features/address/application/get-address.ts",
          content: 'import { getHealth } from "src/features/health";',
        },
      ]),
    ).not.toThrow();
  });
});
