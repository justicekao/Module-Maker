import Link from "next/link";

const CATEGORIES = [
  "Business Planning",
  "Game Design",
  "Research",
  "Book Writing",
  "Screenwriting",
  "Systems Analysis",
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
          Bring your own OpenAI, Anthropic, or Google key
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          The marketplace for AI modules
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Module Maker isn&apos;t an AI itself — it&apos;s where people build
          structured, reusable workflows of prompts and connect them to the
          AI models they already use. Plan a business, design a game, write a
          book, analyze a system. Build it once, share it, or sell it.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/templates" className="btn-primary px-6 py-3 text-base">
            Start from a template
          </Link>
          <Link href="/marketplace" className="btn-secondary px-6 py-3 text-base">
            Browse the marketplace
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="font-semibold">Build a branching flow</h3>
            <p className="mt-2 text-sm text-muted">
              Chain prompts, collect inputs, and branch on the AI&apos;s
              answers with a visual, node-based editor.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Run with any provider</h3>
            <p className="mt-2 text-sm text-muted">
              Connect your own OpenAI, Anthropic, or Google API key. Module
              Maker never touches your AI usage or bills you for tokens.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Share or sell</h3>
            <p className="mt-2 text-sm text-muted">
              Publish modules privately, share them for free, or list them on
              the marketplace and earn from every sale.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-xl font-semibold">Popular categories</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/marketplace?category=${encodeURIComponent(category)}`}
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-brand hover:text-brand"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
