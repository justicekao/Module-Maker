import { completeWithProvider } from "@/lib/providers";
import type { AiProviderId, GraphNode, ModuleGraph, NodeData } from "@/types/graph";
import { findStartNodes } from "@/types/graph";

const MAX_STEPS = 100;

export interface ExecutedStep {
  nodeId: string;
  nodeLabel: string;
  kind: NodeData["kind"];
  provider?: AiProviderId;
  model?: string;
  prompt?: string;
  output?: string;
  status: "COMPLETED" | "FAILED";
  errorMessage?: string;
}

export interface ExecuteGraphOptions {
  graph: ModuleGraph;
  initialInputs: Record<string, string>;
  getApiKey: (provider: AiProviderId) => Promise<string>;
  onStep?: (step: ExecutedStep) => Promise<void> | void;
}

export interface ExecuteGraphResult {
  finalOutput: string | null;
  variables: Record<string, string>;
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
}

function evaluateCondition(
  operator: "contains" | "equals" | "notEquals" | "matches",
  actual: string,
  expected: string,
): boolean {
  switch (operator) {
    case "contains":
      return actual.toLowerCase().includes(expected.toLowerCase());
    case "equals":
      return actual.trim().toLowerCase() === expected.trim().toLowerCase();
    case "notEquals":
      return actual.trim().toLowerCase() !== expected.trim().toLowerCase();
    case "matches":
      return new RegExp(expected, "i").test(actual);
  }
}

function nextNode(graph: ModuleGraph, current: GraphNode, variables: Record<string, string>): GraphNode | null {
  const outgoing = graph.edges.filter((e) => e.source === current.id);
  if (outgoing.length === 0) return null;

  let edge = outgoing[0];
  if (current.data.kind === "condition") {
    const actual = variables[current.data.variableName] ?? "";
    const matched = evaluateCondition(current.data.operator, actual, current.data.value);
    const handle = matched ? "true" : "false";
    const branch = outgoing.find((e) => e.sourceHandle === handle);
    if (!branch) return null;
    edge = branch;
  }

  return graph.nodes.find((n) => n.id === edge.target) ?? null;
}

export async function executeGraph({
  graph,
  initialInputs,
  getApiKey,
  onStep,
}: ExecuteGraphOptions): Promise<ExecuteGraphResult> {
  const starts = findStartNodes(graph);
  if (starts.length !== 1) {
    throw new Error("Module graph must have exactly one starting step.");
  }

  const variables: Record<string, string> = { ...initialInputs };
  let current: GraphNode | null = starts[0];
  let finalOutput: string | null = null;
  let steps = 0;

  while (current) {
    if (steps++ > MAX_STEPS) {
      throw new Error("Module exceeded the maximum number of steps (possible cycle).");
    }

    const node = current;
    const data = node.data;

    try {
      if (data.kind === "input") {
        variables[data.variableName] = initialInputs[data.variableName] ?? data.defaultValue;
        await onStep?.({
          nodeId: node.id,
          nodeLabel: data.label,
          kind: data.kind,
          output: variables[data.variableName],
          status: "COMPLETED",
        });
      } else if (data.kind === "prompt") {
        const apiKey = await getApiKey(data.provider);
        const prompt = interpolate(data.userPromptTemplate, variables);
        const system = data.systemPrompt ? interpolate(data.systemPrompt, variables) : undefined;
        const output = await completeWithProvider(data.provider, {
          apiKey,
          model: data.model,
          systemPrompt: system,
          userPrompt: prompt,
        });
        variables[data.outputVariable] = output;
        await onStep?.({
          nodeId: node.id,
          nodeLabel: data.label,
          kind: data.kind,
          provider: data.provider,
          model: data.model,
          prompt,
          output,
          status: "COMPLETED",
        });
      } else if (data.kind === "condition") {
        const actual = variables[data.variableName] ?? "";
        await onStep?.({
          nodeId: node.id,
          nodeLabel: data.label,
          kind: data.kind,
          output: actual,
          status: "COMPLETED",
        });
      } else if (data.kind === "output") {
        finalOutput = interpolate(data.template, variables);
        await onStep?.({
          nodeId: node.id,
          nodeLabel: data.label,
          kind: data.kind,
          output: finalOutput,
          status: "COMPLETED",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await onStep?.({
        nodeId: node.id,
        nodeLabel: data.label,
        kind: data.kind,
        status: "FAILED",
        errorMessage: message,
      });
      throw error;
    }

    current = nextNode(graph, node, variables);
  }

  return { finalOutput, variables };
}
