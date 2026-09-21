"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type {
  ConditionNodeData,
  InputNodeData,
  OutputNodeData,
  PromptNodeData,
} from "@/types/graph";

const CARD = "min-w-[220px] rounded-lg border-2 bg-card px-4 py-3 shadow-sm";

export function PromptNodeView({ data, selected }: NodeProps) {
  const d = data as unknown as PromptNodeData;
  return (
    <div className={`${CARD} ${selected ? "border-brand" : "border-border"}`}>
      <Handle type="target" position={Position.Top} />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
        Prompt · {d.provider}
      </p>
      <p className="mt-1 text-sm font-medium">{d.label}</p>
      <p className="mt-1 truncate text-xs text-muted">→ {`{{${d.outputVariable}}}`}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function InputNodeView({ data, selected }: NodeProps) {
  const d = data as unknown as InputNodeData;
  return (
    <div className={`${CARD} ${selected ? "border-brand" : "border-border"}`}>
      <Handle type="target" position={Position.Top} />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
        Input
      </p>
      <p className="mt-1 text-sm font-medium">{d.label}</p>
      <p className="mt-1 truncate text-xs text-muted">{`{{${d.variableName}}}`}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function ConditionNodeView({ data, selected }: NodeProps) {
  const d = data as unknown as ConditionNodeData;
  return (
    <div className={`${CARD} ${selected ? "border-brand" : "border-border"}`}>
      <Handle type="target" position={Position.Top} />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
        Condition
      </p>
      <p className="mt-1 text-sm font-medium">{d.label}</p>
      <p className="mt-1 truncate text-xs text-muted">
        {`{{${d.variableName}}}`} {d.operator} &quot;{d.value}&quot;
      </p>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>false</span>
        <span>true</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "75%" }}
      />
    </div>
  );
}

export function OutputNodeView({ data, selected }: NodeProps) {
  const d = data as unknown as OutputNodeData;
  return (
    <div className={`${CARD} ${selected ? "border-brand" : "border-border"}`}>
      <Handle type="target" position={Position.Top} />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
        Output
      </p>
      <p className="mt-1 text-sm font-medium">{d.label}</p>
    </div>
  );
}

export const NODE_TYPES = {
  prompt: PromptNodeView,
  input: InputNodeView,
  condition: ConditionNodeView,
  output: OutputNodeView,
};
