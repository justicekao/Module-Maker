import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: "Draft",
  UNLISTED: "Unlisted",
  PUBLISHED: "Published",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [modules, acquisitions, earnings] = await Promise.all([
    prisma.module.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.acquisition.findMany({
      where: { userId: user.id },
      include: { module: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.acquisition.aggregate({
      where: { module: { ownerId: user.id } },
      _sum: { sellerEarningsCents: true },
    }),
  ]);

  const totalEarnings = (earnings._sum.sellerEarningsCents ?? 0) / 100;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/builder/new" className="btn-primary">
          New module
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-muted">Modules</p>
          <p className="mt-1 text-2xl font-semibold">{modules.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted">Library</p>
          <p className="mt-1 text-2xl font-semibold">{acquisitions.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted">Total earnings</p>
          <p className="mt-1 text-2xl font-semibold">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">My modules</h2>
        {modules.length === 0 ? (
          <p className="mt-3 text-sm text-muted">You haven&apos;t created any modules yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {modules.map((m) => (
              <li key={m.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted">
                    {VISIBILITY_LABEL[m.visibility]} · {m.category}
                    {m.priceCents > 0 ? ` · $${(m.priceCents / 100).toFixed(2)}` : " · Free"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/builder/${m.id}`} className="btn-secondary">
                    Edit
                  </Link>
                  {m.visibility !== "PRIVATE" && (
                    <Link href={`/marketplace/${m.slug}`} className="btn-ghost">
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">My library</h2>
        {acquisitions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Modules you acquire from the marketplace show up here so you can run
            or fork them.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {acquisitions.map((a) => (
              <li key={a.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{a.module.title}</p>
                  <p className="text-xs text-muted">{a.module.category}</p>
                </div>
                <Link href={`/run/${a.module.id}`} className="btn-primary">
                  Run
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
