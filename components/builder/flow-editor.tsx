"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NODE_TYPES } from "@/components/builder/node-views";
import { NodeInspector } from "@/components/builder/node-inspector";
import {
  validateGraph,
  type GraphEdge,
  type GraphNode,
  type ModuleGraph,
  type NodeData,
} from "@/types/graph";

interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLISHED";
}

function toFlowNode(n: GraphNode): Node {
  return { id: n.id, position: n.position, data: n.data as unknown as Record<string, unknown>, type: n.data.kind };
}

function toFlowEdge(e: GraphEdge): Edge {
  return { id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, label: e.label };
}

function defaultDataFor(kind: NodeData["kind"]): NodeData {
  switch (kind) {
    case "prompt":
      return {
        kind: "prompt",
        label: "New prompt",
        provider: "ANTHROPIC",
        model: "claude-sonnet-5",
        systemPrompt: "",
        userPromptTemplate: "",
        outputVariable: "result",
      };
    case "input":
      return { kind: "input", label: "New input", variableName: "input", question: "", defaultValue: "" };
    case "condition":
      return {
        kind: "condition",
        label: "New condition",
        variableName: "result",
        operator: "contains",
        value: "",
      };
    case "output":
      return { kind: "output", label: "Final output", template: "" };
  }
}

export function FlowEditor({ meta, graph }: { meta: ModuleMeta; graph: ModuleGraph }) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges.map(toFlowEdge));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState(meta.title);
  const [priceDollars, setPriceDollars] = useState((meta.priceCents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  function addNode(kind: NodeData["kind"]) {
    const id = crypto.randomUUID();
    const y = nodes.length ? Math.max(...nodes.map((n) => n.position.y)) + 160 : 0;
    setNodes((nds) => [...nds, { id, position: { x: 0, y }, data: defaultDataFor(kind) as unknown as Record<string, unknown>, type: kind }]);
  }

  function updateSelectedData(data: NodeData) {
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: data as unknown as Record<string, unknown> } : n)),
    );
  }

  function deleteSelected() {
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }

  function currentGraph(): ModuleGraph {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data as unknown as NodeData,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
    };
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setErrors([]);
    const res = await fetch(`/api/modules/${meta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, graph: currentGraph() }),
    });
    setSaving(false);
    if (!res.ok) {
      setErrors(["Couldn't save your changes."]);
      return false;
    }
    setSavedAt(new Date());
    return true;
  }

  async function publish() {
    const graph = currentGraph();
    const graphErrors = validateGraph(graph);
    if (graphErrors.length > 0) {
      setErrors(graphErrors);
      return;
    }

    const ok = await save();
    if (!ok) return;

    setPublishing(true);
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    const res = await fetch(`/api/modules/${meta.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility: "PUBLISHED",
        priceCents: Number.isFinite(priceCents) ? priceCents : 0,
      }),
    });
    setPublishing(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErrors(body.details ?? [body.error ?? "Couldn't publish."]);
      return;
    }
    router.refresh();
  }

  const selectedNode = nodes.find((n) => n.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-semibold outline-none hover:border-border focus:border-brand"
        />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>$</span>
          <input
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            className="input w-20"
            placeholder="0.00"
          />
        </div>
        {savedAt && <span className="text-xs text-muted">Saved {savedAt.toLocaleTimeString()}</span>}
        <button onClick={save} disabled={saving} className="btn-secondary">
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button onClick={publish} disabled={publishing} className="btn-primary">
          {publishing ? "Publishing…" : "Publish"}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-44 flex-col gap-2 border-r border-border p-3">
          <p className="text-xs font-semibold uppercase text-muted">Add step</p>
          <button onClick={() => addNode("input")} className="btn-secondary justify-start">
            + Input
          </button>
          <button onClick={() => addNode("prompt")} className="btn-secondary justify-start">
            + Prompt
          </button>
          <button onClick={() => addNode("condition")} className="btn-secondary justify-start">
            + Condition
          </button>
          <button onClick={() => addNode("output")} className="btn-secondary justify-start">
            + Output
          </button>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={NODE_TYPES}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="w-80 border-l border-border">
            <NodeInspector
              data={selectedNode.data as unknown as NodeData}
              onChange={updateSelectedData}
              onDelete={deleteSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
}
