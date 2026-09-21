"use client";

import { AI_PROVIDERS, PROVIDER_MODELS, type AiProviderId, type NodeData } from "@/types/graph";

interface Props {
  data: NodeData;
  onChange: (data: NodeData) => void;
  onDelete: () => void;
}

export function NodeInspector({ data, onChange, onDelete }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Edit step</h2>
        <button onClick={onDelete} className="text-xs text-red-500 hover:underline">
          Delete step
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="label">Label</label>
          <input
            className="input mt-1"
            value={data.label}
            onChange={(e) => onChange({ ...data, label: e.target.value })}
          />
        </div>

        {data.kind === "prompt" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Provider</label>
                <select
                  className="input mt-1"
                  value={data.provider}
                  onChange={(e) => {
                    const provider = e.target.value as AiProviderId;
                    onChange({ ...data, provider, model: PROVIDER_MODELS[provider][0] });
                  }}
                >
                  {AI_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Model</label>
                <select
                  className="input mt-1"
                  value={data.model}
                  onChange={(e) => onChange({ ...data, model: e.target.value })}
                >
                  {PROVIDER_MODELS[data.provider].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">System prompt (optional)</label>
              <textarea
                className="input mt-1 min-h-16"
                value={data.systemPrompt}
                onChange={(e) => onChange({ ...data, systemPrompt: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Prompt template — use {"{{variable}}"} to reference earlier steps
              </label>
              <textarea
                className="input mt-1 min-h-28"
                value={data.userPromptTemplate}
                onChange={(e) => onChange({ ...data, userPromptTemplate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Save output as variable</label>
              <input
                className="input mt-1"
                value={data.outputVariable}
                onChange={(e) => onChange({ ...data, outputVariable: e.target.value })}
              />
            </div>
          </>
        )}

        {data.kind === "input" && (
          <>
            <div>
              <label className="label">Variable name</label>
              <input
                className="input mt-1"
                value={data.variableName}
                onChange={(e) => onChange({ ...data, variableName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Question shown to the person running this</label>
              <textarea
                className="input mt-1 min-h-20"
                value={data.question}
                onChange={(e) => onChange({ ...data, question: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Default value (optional)</label>
              <input
                className="input mt-1"
                value={data.defaultValue}
                onChange={(e) => onChange({ ...data, defaultValue: e.target.value })}
              />
            </div>
          </>
        )}

        {data.kind === "condition" && (
          <>
            <div>
              <label className="label">Variable to check</label>
              <input
                className="input mt-1"
                value={data.variableName}
                onChange={(e) => onChange({ ...data, variableName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Operator</label>
              <select
                className="input mt-1"
                value={data.operator}
                onChange={(e) =>
                  onChange({ ...data, operator: e.target.value as typeof data.operator })
                }
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="notEquals">does not equal</option>
                <option value="matches">matches regex</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input
                className="input mt-1"
                value={data.value}
                onChange={(e) => onChange({ ...data, value: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted">
              Connect this step&apos;s two output handles to the &quot;true&quot; and
              &quot;false&quot; branches of your flow.
            </p>
          </>
        )}

        {data.kind === "output" && (
          <div>
            <label className="label">
              Final output template — use {"{{variable}}"} to include earlier results
            </label>
            <textarea
              className="input mt-1 min-h-40"
              value={data.template}
              onChange={(e) => onChange({ ...data, template: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
