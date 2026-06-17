export type CapabilityKind = "tool" | "resource" | "prompt";

export const mcpKitCoreVersion = "0.0.0";

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

export type AnyToolCapability = ToolCapability<never, unknown>;

export type ResourceCapability = CapabilityBase & {
  readonly kind: "resource";
  readonly uriTemplate: string;
};

export type PromptCapability = CapabilityBase & {
  readonly kind: "prompt";
  readonly argumentsSchema?: JsonSchema;
};

export type Capability =
  | AnyToolCapability
  | ResourceCapability
  | PromptCapability;

export type CapabilityRegistry = {
  readonly capabilities: readonly Capability[];
  readonly get: (name: string) => Capability | undefined;
  readonly tools: () => readonly AnyToolCapability[];
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

export type SourceFile = {
  readonly path: string;
  readonly content: string;
};

type CleanArchitectureLayer = "domain" | "application" | "mcp" | "infrastructure";

type LayerImportRule = {
  readonly blockedImportSegment: string;
  readonly message: string;
};

const CAPABILITY_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const cleanArchitectureRules: Readonly<Record<CleanArchitectureLayer, readonly LayerImportRule[]>> = {
  application: [
    {
      blockedImportSegment: "/mcp",
      message: "imports MCP",
    },
    {
      blockedImportSegment: "/infrastructure",
      message: "imports infrastructure",
    },
    {
      blockedImportSegment: "@modelcontextprotocol",
      message: "imports MCP SDK",
    },
  ],
  domain: [
    {
      blockedImportSegment: "/mcp",
      message: "imports MCP",
    },
    {
      blockedImportSegment: "@modelcontextprotocol",
      message: "imports MCP SDK",
    },
  ],
  infrastructure: [],
  mcp: [
    {
      blockedImportSegment: "/infrastructure",
      message: "imports infrastructure",
    },
  ],
};

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

  const tool = capability as ToolCapability<TInput, TStructuredContent>;

  return tool.handler(input, context) as Promise<ToolCallResult<TStructuredContent>>;
}

export function assertValidRegistry(registry: CapabilityRegistry): void {
  const errors = validateRegistry(registry);

  if (errors.length > 0) {
    throw new Error(`Invalid capability registry:\n${formatErrorList(errors)}`);
  }
}

export function assertNoDependencyCycles(files: readonly SourceFile[]): void {
  const errors = validateNoDependencyCycles(files);

  if (errors.length > 0) {
    throw new Error(`Dependency cycles detected:\n${formatErrorList(errors)}`);
  }
}

export function assertFeatureBoundaries(files: readonly SourceFile[]): void {
  const errors = validateFeatureBoundaries(files);

  if (errors.length > 0) {
    throw new Error(`Feature boundary violations:\n${formatErrorList(errors)}`);
  }
}

export function assertCleanArchitectureLayers(files: readonly SourceFile[]): void {
  const errors = validateCleanArchitectureLayers(files);

  if (errors.length > 0) {
    throw new Error(`Clean architecture violations:\n${formatErrorList(errors)}`);
  }
}

export function assertCapabilityRegistry(registry: CapabilityRegistry): void {
  assertValidRegistry(registry);
}

export function assertMcpAnnotations(registry: CapabilityRegistry): void {
  const errors = registry.capabilities.flatMap((capability) => {
    const capabilityErrors: string[] = [];
    validateAnnotations(capability, capabilityErrors);
    return capabilityErrors;
  });

  if (errors.length > 0) {
    throw new Error(`Invalid MCP annotations:\n${formatErrorList(errors)}`);
  }
}

export function assertToolSchemas(registry: CapabilityRegistry): void {
  const errors = registry.tools().flatMap((tool) => {
    const toolErrors: string[] = [];
    validateTool(tool, toolErrors);
    return toolErrors;
  });

  if (errors.length > 0) {
    throw new Error(`Invalid tool schemas:\n${formatErrorList(errors)}`);
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

function validateTool(tool: AnyToolCapability, errors: string[]): void {
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

function validateCleanArchitectureLayers(files: readonly SourceFile[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const layer = getLayer(file.path);
    const imports = extractImports(file.content);

    if (!layer) {
      continue;
    }

    for (const importPath of imports) {
      validateLayerImport(file.path, layer, importPath, errors);
    }
  }

  return errors;
}

function validateLayerImport(
  filePath: string,
  layer: CleanArchitectureLayer,
  importPath: string,
  errors: string[],
): void {
  for (const rule of cleanArchitectureRules[layer]) {
    if (importPath.includes(rule.blockedImportSegment)) {
      errors.push(`${filePath} ${rule.message} from ${importPath}.`);
    }
  }
}

function validateFeatureBoundaries(files: readonly SourceFile[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const sourceFeature = getFeatureName(file.path);

    if (!sourceFeature) {
      continue;
    }

    for (const importPath of extractImports(file.content)) {
      const normalizedImportPath = importPath.startsWith(".")
        ? resolveRelativePathWithoutExtension(file.path, importPath)
        : importPath;
      const targetFeature = getImportedFeatureName(normalizedImportPath);

      if (
        targetFeature &&
        targetFeature !== sourceFeature &&
        !normalizedImportPath.endsWith(`/features/${targetFeature}`)
      ) {
        errors.push(`${file.path} imports feature "${targetFeature}" without using its index.ts boundary.`);
      }
    }
  }

  return errors;
}

function validateNoDependencyCycles(files: readonly SourceFile[]): string[] {
  const graph = createImportGraph(files);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const errors: string[] = [];

  for (const file of graph.keys()) {
    visitFile(file, graph, visiting, visited, [], errors);
  }

  return errors;
}

function createImportGraph(files: readonly SourceFile[]): Map<string, readonly string[]> {
  const knownPaths = new Set(files.map((file) => normalizePath(file.path)));
  const graph = new Map<string, readonly string[]>();

  for (const file of files) {
    const filePath = normalizePath(file.path);
    const imports = extractImports(file.content)
      .filter((importPath) => importPath.startsWith("."))
      .map((importPath) => resolveRelativeImport(filePath, importPath, knownPaths))
      .filter((importPath): importPath is string => Boolean(importPath));

    graph.set(filePath, imports);
  }

  return graph;
}

function visitFile(
  file: string,
  graph: Map<string, readonly string[]>,
  visiting: Set<string>,
  visited: Set<string>,
  stack: readonly string[],
  errors: string[],
): void {
  if (visiting.has(file)) {
    const cycleStart = stack.indexOf(file);
    errors.push([...stack.slice(cycleStart), file].join(" -> "));
    return;
  }

  if (visited.has(file)) {
    return;
  }

  visiting.add(file);

  for (const dependency of graph.get(file) ?? []) {
    visitFile(dependency, graph, visiting, visited, [...stack, file], errors);
  }

  visiting.delete(file);
  visited.add(file);
}

function extractImports(content: string): readonly string[] {
  const imports: string[] = [];

  for (const line of content.split(/\r?\n/u)) {
    const importPath = extractImportPath(line.trim());

    if (importPath) {
      imports.push(importPath);
    }
  }

  return imports;
}

function extractImportPath(line: string): string | undefined {
  if (!line.startsWith("import")) {
    return undefined;
  }

  const fromMarker = " from ";
  const fromIndex = line.lastIndexOf(fromMarker);
  const specifier = fromIndex >= 0 ? line.slice(fromIndex + fromMarker.length).trim() : line.slice("import".length).trim();

  return readQuotedSpecifier(specifier);
}

function readQuotedSpecifier(value: string): string | undefined {
  const quote = value[0];

  if (quote !== "\"" && quote !== "'") {
    return undefined;
  }

  const endIndex = value.indexOf(quote, 1);

  return endIndex > 1 ? value.slice(1, endIndex) : undefined;
}

function getLayer(path: string): CleanArchitectureLayer | undefined {
  if (path.includes("/domain/")) {
    return "domain";
  }

  if (path.includes("/application/")) {
    return "application";
  }

  if (path.includes("/mcp/")) {
    return "mcp";
  }

  if (path.includes("/infrastructure/")) {
    return "infrastructure";
  }

  return undefined;
}

function getFeatureName(path: string): string | undefined {
  return path.match(/(?:^|\/)features\/([^/]+)\//)?.[1];
}

function getImportedFeatureName(path: string): string | undefined {
  return path.match(/(?:^|\/)features\/([^/]+)(?:\/|$)/)?.[1];
}

function resolveRelativeImport(sourcePath: string, importPath: string, knownPaths: Set<string>): string | undefined {
  const normalized = resolveRelativePathWithoutExtension(sourcePath, importPath);
  const candidates = [normalized, `${normalized}.ts`, `${normalized}/index.ts`];

  return candidates.find((candidate) => knownPaths.has(candidate));
}

function resolveRelativePathWithoutExtension(sourcePath: string, importPath: string): string {
  const sourceDirectory = sourcePath.split("/").slice(0, -1);
  const parts = [...sourceDirectory, ...importPath.split("/")];
  const normalizedParts: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      normalizedParts.pop();
      continue;
    }

    normalizedParts.push(part);
  }

  return normalizedParts.join("/");
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replaceAll(/^\.\//g, "");
}

function schemaHasLimit(schema: JsonSchema | undefined): boolean {
  return Boolean(schema?.properties?.limit);
}

function formatErrorList(errors: readonly string[]): string {
  return errors.map((error) => `- ${error}`).join("\n");
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

function isToolCapability(capability: Capability): capability is AnyToolCapability {
  return capability.kind === "tool";
}

function isResourceCapability(capability: Capability): capability is ResourceCapability {
  return capability.kind === "resource";
}

function isPromptCapability(capability: Capability): capability is PromptCapability {
  return capability.kind === "prompt";
}
