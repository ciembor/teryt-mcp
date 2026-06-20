import { defineTool } from "@mcp-craftsman/core";

import { syncDatabase, type SyncDatabaseInput } from "../application/sync-database.js";
import type { SyncMode } from "../domain/sync-plan.js";

type CreateSyncDatabaseToolInput = Omit<SyncDatabaseInput, "mode">;

export function createSyncDatabaseTool(input: CreateSyncDatabaseToolInput) {
  return defineTool({
    inputSchema,
    outputSchema,
    name: "sync_database",
    description: "Synchronizes the local TERYT database.",
    policy: "write",
    returnsStructuredContent: true,
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      readOnlyHint: false,
    },
    handler: async (toolInput) => ({
      structuredContent: await syncDatabase({
        ...input,
        mode: parseMode(toolInput),
      }),
    }),
  });
}

const inputSchema = {
  type: "object",
  properties: {
    mode: {
      type: "string",
      enum: ["missing", "stale", "force"],
    },
  },
  required: ["mode"],
};

const outputSchema = {
  type: "object",
  properties: {
    databasePath: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
    datasets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          columns: {
            type: "array",
            items: {
              type: "string",
            },
          },
          dataset: {
            type: "string",
            enum: ["TERC", "SIMC", "ULIC", "WMRODZ"],
          },
          downloadedAt: {
            type: "string",
          },
          publishedAtObserved: {
            anyOf: [
              {
                type: "string",
              },
              {
                type: "null",
              },
            ],
          },
          recordCount: {
            type: "number",
          },
          sha256: {
            type: "string",
          },
          source: {
            type: "string",
          },
          sourceUrl: {
            type: "string",
          },
          stateDate: {
            type: "string",
          },
          variant: {
            type: "string",
            enum: ["full"],
          },
        },
        required: [
          "columns",
          "dataset",
          "downloadedAt",
          "publishedAtObserved",
          "recordCount",
          "sha256",
          "source",
          "sourceUrl",
          "stateDate",
          "variant",
        ],
      },
    },
    mode: {
      type: "string",
      enum: ["missing", "stale", "force"],
    },
    status: {
      type: "string",
      enum: ["skipped", "synced"],
    },
  },
  required: ["databasePath", "datasets", "mode", "status"],
};

function parseMode(input: unknown): SyncMode {
  if (typeof input === "object" && input !== null && "mode" in input) {
    const mode = input.mode;

    if (mode === "missing" || mode === "stale" || mode === "force") {
      return mode;
    }
  }

  throw new Error("sync_database requires mode: missing | stale | force.");
}
