"use client";

import { useEffect, useState } from "react";
import { AI_PROVIDERS, type AiProviderId } from "@/types/graph";

interface ApiKeyRow {
  id: string;
  provider: AiProviderId;
  label: string;
  masked: string;
  createdAt: string;
}

const PROVIDER_NAMES: Record<AiProviderId, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
};

export function KeysManager() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<AiProviderId>("OPENAI");
  const [label, setLabel] = useState("Default");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/keys");
    setKeys(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render loop
    void load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, label, apiKey }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't save that key.");
      return;
    }
    setApiKey("");
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="provider">Provider</label>
            <select
              id="provider"
              className="input mt-1"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_NAMES[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="key-label">Label</label>
            <input
              id="key-label"
              className="input mt-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Default"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="api-key">API key</label>
          <input
            id="api-key"
            type="password"
            className="input mt-1"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : "Add key"}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-medium text-muted">Connected keys</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No keys connected yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="card flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {PROVIDER_NAMES[k.provider]} · {k.label}
                  </p>
                  <p className="text-xs text-muted">{k.masked}</p>
                </div>
                <button onClick={() => handleDelete(k.id)} className="btn-ghost text-red-500">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
