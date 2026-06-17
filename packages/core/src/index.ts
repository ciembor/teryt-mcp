export type CapabilityKind = "tool" | "resource" | "prompt";

export type CapabilityPolicy = "read" | "write";

export type JsonSchema = {
  readonly type?: string;
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
  readonly [key: string]: unknown;
};

export type McpAnnotations = {
  readonly readOnlyHint?: boolean;
  readonly destructiveHint?: boolean;
  readonly idempotentHint?: boolean;
  readonly openWorldHint?: boolean;
};

export type CapabilityBase = {
  readonly kind: CapabilityKind;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly policy: CapabilityPolicy;
  readonly annotations?: McpAnnotations;
};

export type ToolCallContext = {
  readonly signal?: AbortSignal;
};

export type ToolCallResult<TStructuredContent = unknown> = {
  readonly content?: readonly unknown[];
  readonly structuredContent?: TStructuredContent;
};

export type ToolHandler<TInput = unknown, TStructuredContent = unknown> = (
  input: TInput,
  context: ToolCallContext,
) => ToolCallResult<TStructuredContent> | Promise<ToolCallResult<TStructuredContent>>;

export type ToolCapability<TInput = unknown, TStructuredContent = unknown> = CapabilityBase & {
  readonly kind: "tool";
  readonly inputSchema?: JsonSchema;
  readonly outputSchema?: JsonSchema;
  readonly returnsStructuredContent?: boolean;
  readonly handler: ToolHandler<TInput, TStructuredContent>;
};

export type ResourceCapability = CapabilityBase & {
  readonly kind: "resource";
  readonly uriTemplate: string;
};

export type PromptCapability = CapabilityBase & {
  readonly kind: "prompt";
  readonly argumentsSchema?: JsonSchema;
};

export type Capability =
  | ToolCapability
  | ResourceCapability
  | PromptCapability;

export type CapabilityRegistry = {
  readonly capabilities: readonly Capability[];
  readonly get: (name: string) => Capability | undefined;
  readonly tools: () => readonly ToolCapability[];
  readonly resources: () => readonly ResourceCapability[];
  readonly prompts: () => readonly PromptCapability[];
};

export type McpApp = {
  readonly name: string;
  readonly version: string;
  readonly registry: CapabilityRegistry;
};

export type Feature = {
  readonly name: string;
  readonly capabilities: readonly Capability[];
};

export type McpAppDefinition = {
  readonly name: string;
  readonly version: string;
  readonly registry: CapabilityRegistry;
};

const CAPABILITY_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export function defineTool<TInput = unknown, TStructuredContent = unknown>(
  capability: Omit<ToolCapability<TInput, TStructuredContent>, "kind">,
): ToolCapability<TInput, TStructuredContent> {
  return {
    ...capability,
    kind: "tool",
  };
}

export function defineResource(
  capability: Omit<ResourceCapability, "kind" | "policy"> & Partial<Pick<ResourceCapability, "policy">>,
): ResourceCapability {
  return {
    policy: "read",
    ...capability,
    kind: "resource",
  };
}

export function definePrompt(
  capability: Omit<PromptCapability, "kind" | "policy"> & Partial<Pick<PromptCapability, "policy">>,
): PromptCapability {
  return {
    policy: "read",
    ...capability,
    kind: "prompt",
  };
}

export function defineFeature(feature: Feature): Feature {
  return {
    ...feature,
    capabilities: sortCapabilities(feature.capabilities),
  };
}

export function createMcpApp(definition: McpAppDefinition): McpApp {
  assertValidRegistry(definition.registry);

  return {
    name: definition.name,
    version: definition.version,
    registry: definition.registry,
  };
}

export function createCapabilityRegistry(capabilities: readonly Capability[]): CapabilityRegistry {
  const sortedCapabilities = sortCapabilities(capabilities);
  const registry: CapabilityRegistry = {
    capabilities: sortedCapabilities,
    get: (name) => sortedCapabilities.find((capability) => capability.name === name),
    tools: () => sortedCapabilities.filter(isToolCapability),
    resources: () => sortedCapabilities.filter(isResourceCapability),
    prompts: () => sortedCapabilities.filter(isPromptCapability),
  };

  assertValidRegistry(registry);

  return registry;
}

export function createTestApp(capabilities: readonly Capability[] = []): McpApp {
  return createMcpApp({
    name: "test-app",
    version: "0.0.0",
    registry: createCapabilityRegistry(capabilities),
  });
}

export async function callTool<TInput = unknown, TStructuredContent = unknown>(
  app: McpApp,
  name: string,
  input: TInput,
  context: ToolCallContext = {},
): Promise<ToolCallResult<TStructuredContent>> {
  const capability = app.registry.get(name);

  if (!capability || capability.kind !== "tool") {
    throw new Error(`Tool "${name}" is not registered.`);
  }

  return capability.handler(input, context) as Promise<ToolCallResult<TStructuredContent>>;
}

export function assertValidRegistry(registry: CapabilityRegistry): void {
  const errors = validateRegistry(registry);

  if (errors.length > 0) {
    throw new Error(`Invalid capability registry:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

export function validateRegistry(registry: CapabilityRegistry): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const expectedOrder = sortCapabilities(registry.capabilities);

  registry.capabilities.forEach((capability, index) => {
    if (seenNames.has(capability.name)) {
      errors.push(`Capability name "${capability.name}" is duplicated.`);
    }
    seenNames.add(capability.name);

    if (!CAPABILITY_NAME_PATTERN.test(capability.name)) {
      errors.push(`Capability name "${capability.name}" must use snake_case.`);
    }

    if (capability !== expectedOrder[index]) {
      errors.push("Capability registry must be sorted deterministically by name and kind.");
    }

    validateAnnotations(capability, errors);

    if (capability.kind === "tool") {
      validateTool(capability, errors);
    }
  });

  return errors;
}

function validateTool(tool: ToolCapability, errors: string[]): void {
  if (tool.returnsStructuredContent === true && !tool.outputSchema) {
    errors.push(`Tool "${tool.name}" returns structuredContent and must define outputSchema.`);
  }

  if (tool.name.startsWith("list_") && !schemaHasLimit(tool.inputSchema)) {
    errors.push(`Tool "${tool.name}" must define a limit input.`);
  }

  if (tool.name.includes("search") && !schemaHasLimit(tool.inputSchema)) {
    errors.push(`Search tool "${tool.name}" must define a limit input.`);
  }
}

function validateAnnotations(capability: Capability, errors: string[]): void {
  if (capability.policy === "read" && capability.annotations?.readOnlyHint !== true) {
    errors.push(`Capability "${capability.name}" is read-only and must set annotations.readOnlyHint to true.`);
  }

  if (capability.policy === "read" && capability.annotations?.destructiveHint === true) {
    errors.push(`Capability "${capability.name}" is read-only and cannot set annotations.destructiveHint to true.`);
  }

  if (capability.policy === "write" && capability.annotations?.readOnlyHint === true) {
    errors.push(`Capability "${capability.name}" is write-capable and cannot set annotations.readOnlyHint to true.`);
  }
}

function schemaHasLimit(schema: JsonSchema | undefined): boolean {
  return Boolean(schema?.properties?.limit);
}

function sortCapabilities(capabilities: readonly Capability[]): readonly Capability[] {
  return [...capabilities].sort((left, right) => {
    const byName = left.name.localeCompare(right.name);

    if (byName !== 0) {
      return byName;
    }

    return left.kind.localeCompare(right.kind);
  });
}

function isToolCapability(capability: Capability): capability is ToolCapability {
  return capability.kind === "tool";
}

function isResourceCapability(capability: Capability): capability is ResourceCapability {
  return capability.kind === "resource";
}

function isPromptCapability(capability: Capability): capability is PromptCapability {
  return capability.kind === "prompt";
}
