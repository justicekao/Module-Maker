"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ModuleTemplate } from "@/lib/templates/seedTemplates";

export function NewModuleForm({ templates }: { templates: ModuleTemplate[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [creating, setCreating] = useState(false);

  async function createModule(body: Record<string, unknown>) {
    setCreating(true);
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCreating(false);
    if (!res.ok) return;
    const created = await res.json();
    router.push(`/builder/${created.id}`);
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createModule({ title, description, category });
        }}
        className="card space-y-4 p-6"
      >
        <h2 className="font-semibold">Start blank</h2>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            required
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My module"
          />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="input mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <input
            id="category"
            className="input mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button type="submit" disabled={creating} className="btn-primary">
          {creating ? "Creating…" : "Create blank module"}
        </button>
      </form>

      <div>
        <h2 className="font-semibold">Or start from a template</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.key} className="card p-5">
              <p className="text-xs font-medium text-brand">{t.category}</p>
              <p className="mt-1 font-medium">{t.title}</p>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <button
                onClick={() => createModule({ templateKey: t.key })}
                disabled={creating}
                className="btn-secondary mt-4"
              >
                Use template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
