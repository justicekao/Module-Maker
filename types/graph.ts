import { z } from "zod";

// A module is a branching graph of steps. Execution starts at the node with
// no incoming edges (validated at save time) and follows edges until it
// reaches an Output node or a node with no outgoing edge.

export const AI_PROVIDERS = ["OPENAI", "ANTHROPIC", "GOOGLE"] as const;
export type AiProviderId = (typeof AI_PROVIDERS)[number];

export const PROVIDER_MODELS: Record<AiProviderId, string[]> = {
  OPENAI: ["gpt-5.1", "gpt-5.1-mini"],
  ANTHROPIC: ["claude-sonnet-5", "claude-haiku-4-5-20251001"],
  GOOGLE: ["gemini-3-pro", "gemini-3-flash"],
};

const positionSchema = z.object({ x: z.number(), y: z.number() });

export const promptNodeDataSchema = z.object({
  kind: z.literal("prompt"),
  label: z.string().min(1),
  provider: z.enum(AI_PROVIDERS),
  model: z.string().min(1),
  systemPrompt: z.string().default(""),
  userPromptTemplate: z.string().min(1),
  outputVariable: z.string().min(1),
});

export const inputNodeDataSchema = z.object({
  kind: z.literal("input"),
  label: z.string().min(1),
  variableName: z.string().min(1),
  question: z.string().min(1),
  defaultValue: z.string().default(""),
});

export const conditionNodeDataSchema = z.object({
  kind: z.literal("condition"),
  label: z.string().min(1),
  variableName: z.string().min(1),
  operator: z.enum(["contains", "equals", "notEquals", "matches"]),
  value: z.string(),
});

export const outputNodeDataSchema = z.object({
  kind: z.literal("output"),
  label: z.string().min(1),
  template: z.string().min(1),
});

export const nodeDataSchema = z.discriminatedUnion("kind", [
  promptNodeDataSchema,
  inputNodeDataSchema,
  conditionNodeDataSchema,
  outputNodeDataSchema,
]);

export const graphNodeSchema = z.object({
  id: z.string(),
  position: positionSchema,
  data: nodeDataSchema,
});

export const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  // For condition nodes: "true" | "false". Undefined for all other node types.
  sourceHandle: z.string().optional(),
  label: z.string().optional(),
});

export const moduleGraphSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type PromptNodeData = z.infer<typeof promptNodeDataSchema>;
export type InputNodeData = z.infer<typeof inputNodeDataSchema>;
export type ConditionNodeData = z.infer<typeof conditionNodeDataSchema>;
export type OutputNodeData = z.infer<typeof outputNodeDataSchema>;
export type NodeData = z.infer<typeof nodeDataSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type ModuleGraph = z.infer<typeof moduleGraphSchema>;

export function emptyGraph(): ModuleGraph {
  return { nodes: [], edges: [] };
}

// Finds the node(s) with no incoming edge - the graph's entry point(s).
// A valid, runnable graph has exactly one.
export function findStartNodes(graph: ModuleGraph): GraphNode[] {
  const targets = new Set(graph.edges.map((e) => e.target));
  return graph.nodes.filter((n) => !targets.has(n.id));
}

export function validateGraph(graph: ModuleGraph): string[] {
  const errors: string[] = [];
  if (graph.nodes.length === 0) {
    errors.push("Add at least one step to the module.");
    return errors;
  }

  const starts = findStartNodes(graph);
  if (starts.length === 0) {
    errors.push("The graph has no starting step (every step has an incoming connection - check for a cycle).");
  } else if (starts.length > 1) {
    errors.push(
      `The graph has ${starts.length} disconnected starting steps: ${starts
        .map((n) => n.data.label)
        .join(", ")}. Connect them into a single flow.`,
    );
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push("A connection references a step that no longer exists.");
    }
  }

  for (const node of graph.nodes) {
    if (node.data.kind === "condition") {
      const outgoing = graph.edges.filter((e) => e.source === node.id);
      const handles = new Set(outgoing.map((e) => e.sourceHandle));
      if (!handles.has("true") || !handles.has("false")) {
        errors.push(
          `Condition step "${node.data.label}" needs both a true and a false branch connected.`,
        );
      }
    } else {
      const outgoing = graph.edges.filter((e) => e.source === node.id);
      if (outgoing.length > 1) {
        errors.push(
          `Step "${node.data.label}" has more than one outgoing connection; only condition steps can branch.`,
        );
      }
    }
  }

  return errors;
}
