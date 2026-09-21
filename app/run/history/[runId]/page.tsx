import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function RunHistoryPage(props: PageProps<"/run/history/[runId]">) {
  const user = await requireUser();
  const { runId } = await props.params;

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { steps: { orderBy: { createdAt: "asc" } }, module: true },
  });
  if (!run || run.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{run.module.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Run on {run.startedAt.toLocaleString()} · {run.status}
      </p>

      <ol className="mt-8 space-y-3">
        {run.steps.map((step) => (
          <li key={step.id} className="card p-4">
            <p className="text-sm font-medium">
              {step.nodeLabel}{" "}
              <span className={step.status === "FAILED" ? "text-red-500" : "text-emerald-600"}>
                · {step.status}
              </span>
            </p>
            {step.output && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{step.output}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
