import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema } from "@/types/graph";
import { AcquireActions } from "@/components/marketplace/acquire-actions";

const KIND_LABEL: Record<string, string> = {
  input: "Input",
  prompt: "AI prompt",
  condition: "Branch",
  output: "Output",
};

export default async function ModuleDetailPage(props: PageProps<"/marketplace/[slug]">) {
  const { slug } = await props.params;
  const session = await auth();

  const module_ = await prisma.module.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true } },
      publishedVersion: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!module_ || module_.visibility === "PRIVATE" || !module_.publishedVersion) notFound();

  const graph = moduleGraphSchema.parse(module_.publishedVersion.graph);
  const isOwner = session?.user?.id === module_.owner.id;

  const acquisition = session?.user
    ? await prisma.acquisition.findUnique({
        where: { userId_moduleId: { userId: session.user.id, moduleId: module_.id } },
      })
    : null;

  const avgRating =
    module_.reviews.length > 0
      ? module_.reviews.reduce((sum, r) => sum + r.rating, 0) / module_.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs font-medium text-brand">{module_.category}</p>
      <h1 className="mt-1 text-3xl font-semibold">{module_.title}</h1>
      <p className="mt-2 text-sm text-muted">
        by {module_.owner.name}
        {avgRating !== null && ` · ${avgRating.toFixed(1)}★ (${module_.reviews.length})`}
      </p>
      <p className="mt-4 max-w-2xl text-foreground/90">{module_.description}</p>

      <div className="mt-6">
        <AcquireActions
          moduleId={module_.id}
          slug={module_.slug}
          priceCents={module_.priceCents}
          isOwner={isOwner}
          alreadyAcquired={Boolean(acquisition) || isOwner}
          isLoggedIn={Boolean(session?.user)}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          What this module does ({graph.nodes.length} steps)
        </h2>
        <ol className="mt-4 space-y-2">
          {graph.nodes.map((n, i) => (
            <li key={n.id} className="card flex items-center gap-3 p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-brand">
                {i + 1}
              </span>
              <span className="text-xs font-medium uppercase text-muted">
                {KIND_LABEL[n.data.kind]}
              </span>
              <span className="text-sm">{n.data.label}</span>
            </li>
          ))}
        </ol>
      </section>

      {module_.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <ul className="mt-4 space-y-3">
            {module_.reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <p className="text-sm font-medium">
                  {r.user.name} · {r.rating}★
                </p>
                {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
