import { defineTool } from "@mcp-craftsman/core";

import { getAbout, type GetAboutInput } from "../application/get-about.js";

export function createAboutTool(input: GetAboutInput) {
  return defineTool({
    outputSchema,
    name: "about",
    description:
      "Returns package information, author contact, repository URL, server version, and local TERYT data synchronization status.",
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async () => ({
      structuredContent: await getAbout(input),
    }),
  });
}

const outputSchema = {
  type: "object",
  properties: {
    author: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    },
    contact: {
      type: "object",
      properties: {
        email: {
          type: "string",
        },
      },
      required: ["email"],
    },
    repository: {
      type: "object",
      properties: {
        url: {
          type: "string",
        },
      },
      required: ["url"],
    },
    server: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        version: {
          type: "string",
        },
      },
      required: ["name", "version"],
    },
    data: {
      type: "object",
      properties: {
        datasets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dataset: {
                type: "string",
                enum: ["TERC", "SIMC", "ULIC", "WMRODZ"],
              },
              stateDate: {
                type: "string",
              },
              version: {
                type: "string",
              },
            },
            required: ["dataset", "stateDate", "version"],
          },
        },
        lastSynchronizedAt: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
        status: {
          type: "string",
          enum: ["missing", "available"],
        },
        synchronizedSuccessfully: {
          type: "boolean",
        },
      },
      required: ["datasets", "lastSynchronizedAt", "status", "synchronizedSuccessfully"],
    },
  },
  required: ["author", "contact", "repository", "server", "data"],
};
