import { searchMatchKinds } from "../shared/search-entities.js";

type EntitySchema = {
  readonly properties: Readonly<Record<string, unknown>>;
  readonly required: readonly string[];
  readonly type: "object";
};

export const queryLimitInputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
    },
    limit: {
      type: "number",
      default: 20,
      maximum: 100,
      minimum: 1,
    },
  },
  required: ["query"],
};

const nullableStringSchema = {
  anyOf: [
    {
      type: "string",
    },
    {
      type: "null",
    },
  ],
};

export function createSearchOutputSchema(collectionName: string, entityName: string, entitySchema: EntitySchema) {
  return {
    type: "object",
    properties: {
      [collectionName]: {
        type: "array",
        items: {
          type: "object",
          properties: {
            confidence: {
              type: "number",
            },
            matchedBy: {
              type: "string",
              enum: [...searchMatchKinds],
            },
            [entityName]: entitySchema,
          },
          required: ["confidence", "matchedBy", entityName],
        },
      },
      stateDate: nullableStringSchema,
    },
    required: [collectionName, "stateDate"],
  };
}
