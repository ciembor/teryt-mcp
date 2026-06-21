export const resolveAddressInputSchema = {
  type: "object",
  properties: {
    query: { type: "string" },
    place: {
      type: "string",
      description: "SIMC locality/miejscowość name, for example Warszawa.",
    },
    street: {
      type: "string",
      description: "ULIC street/ulica name, for example Marszałkowska.",
    },
    limit: { type: "number", default: 20, maximum: 100, minimum: 1 },
  },
  anyOf: [{ required: ["query"] }, { required: ["place", "street"] }],
};

export const resolveAddressOutputSchema = {
  type: "object",
  properties: {
    addresses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              id: { type: "string" },
              place: {
                type: "object",
                properties: { id: { type: "string" }, name: { type: "string" } },
                required: ["id", "name"],
              },
              stateDate: { type: "string" },
              street: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  id: { type: "string" },
                  name: { type: "string" },
                },
                required: ["code", "id", "name"],
              },
              unit: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                },
                required: ["id", "name", "type"],
              },
            },
            required: ["id", "place", "stateDate", "street", "unit"],
          },
          confidence: { type: "number" },
          matchedBy: {
            type: "string",
            enum: ["exact_code", "exact_normalized_address", "prefix"],
          },
        },
        required: ["address", "confidence", "matchedBy"],
      },
    },
    stateDate: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["addresses", "stateDate"],
};
