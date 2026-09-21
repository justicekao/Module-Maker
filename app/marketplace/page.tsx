import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MarketplacePage(props: PageProps<"/marketplace">) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const modules = await prisma.module.findMany({
    where: {
      visibility: "PUBLISHED",
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { owner: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.module.findMany({
    where: { visibility: "PUBLISHED" },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Marketplace</h1>

      <form className="mt-6 flex flex-wrap items-center gap-3" action="/marketplace">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search modules…"
          className="input max-w-sm"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            href="/marketplace"
            className={`rounded-full border px-3 py-1 text-xs ${
              !category ? "border-brand text-brand" : "border-border text-muted"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.category}
              href={`/marketplace?category=${encodeURIComponent(c.category)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                category === c.category ? "border-brand text-brand" : "border-border text-muted"
              }`}
            >
              {c.category}
            </Link>
          ))}
        </div>
      </form>

      {modules.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No modules found.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link key={m.id} href={`/marketplace/${m.slug}`} className="card block p-5 hover:border-brand">
              <p className="text-xs font-medium text-brand">{m.category}</p>
              <p className="mt-1 font-medium">{m.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>by {m.owner.name}</span>
                <span className="font-medium text-foreground">
                  {m.priceCents > 0 ? `$${(m.priceCents / 100).toFixed(2)}` : "Free"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
