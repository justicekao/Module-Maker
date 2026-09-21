import Link from "next/link";
import { SEED_TEMPLATES } from "@/lib/templates/seedTemplates";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Templates</h1>
      <p className="mt-1 text-sm text-muted">
        Starting points for common kinds of modules. Pick one in the builder
        and customize every step.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SEED_TEMPLATES.map((t) => (
          <div key={t.key} className="card p-5">
            <p className="text-xs font-medium text-brand">{t.category}</p>
            <p className="mt-1 font-medium">{t.title}</p>
            <p className="mt-1 text-sm text-muted">{t.description}</p>
            <p className="mt-3 text-xs text-muted">{t.graph.nodes.length} steps</p>
            <Link href="/builder/new" className="btn-secondary mt-4">
              Use this template
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
