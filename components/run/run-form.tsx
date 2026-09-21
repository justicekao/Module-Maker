"use client";

import { useState } from "react";
import Link from "next/link";

interface InputSpec {
  nodeId: string;
  variableName: string;
  question: string;
  defaultValue: string;
}

interface RunStepResult {
  id: string;
  nodeLabel: string;
  status: string;
  output: string | null;
  errorMessage: string | null;
}

interface RunResult {
  run: { id: string; status: string; steps: RunStepResult[] };
  finalOutput?: string | null;
  error?: string;
}

export function RunForm({ moduleId, inputs }: { moduleId: string; inputs: InputSpec[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(inputs.map((i) => [i.variableName, i.defaultValue])),
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setResult(null);
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, inputs: values }),
    });
    const body = await res.json();
    setRunning(false);
    setResult(body);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {inputs.length === 0 ? (
          <p className="text-sm text-muted">This module needs no input — just run it.</p>
        ) : (
          inputs.map((input) => (
            <div key={input.nodeId}>
              <label className="label">{input.question}</label>
              <textarea
                className="input mt-1"
                value={values[input.variableName] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [input.variableName]: e.target.value }))
                }
              />
            </div>
          ))
        )}
        <button type="submit" disabled={running} className="btn-primary">
          {running ? "Running…" : "Run module"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {result.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {result.error}{" "}
              {result.error.includes("API key") && (
                <Link href="/settings/keys" className="underline">
                  Add a key
                </Link>
              )}
            </p>
          )}

          <h2 className="text-lg font-semibold">Steps</h2>
          <ol className="space-y-3">
            {result.run.steps.map((step) => (
              <li key={step.id} className="card p-4">
                <p className="text-sm font-medium">
                  {step.nodeLabel}{" "}
                  <span
                    className={
                      step.status === "FAILED" ? "text-red-500" : "text-emerald-600"
                    }
                  >
                    · {step.status}
                  </span>
                </p>
                {step.output && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{step.output}</p>
                )}
                {step.errorMessage && (
                  <p className="mt-2 text-sm text-red-500">{step.errorMessage}</p>
                )}
              </li>
            ))}
          </ol>

          {result.finalOutput && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold">Final output</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm">{result.finalOutput}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
