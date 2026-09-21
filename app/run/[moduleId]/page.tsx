import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema } from "@/types/graph";
import { RunForm } from "@/components/run/run-form";

export default async function RunModulePage(props: PageProps<"/run/[moduleId]">) {
  const user = await requireUser();
  const { moduleId } = await props.params;

  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { publishedVersion: true },
  });
  if (!module_ || module_.visibility === "PRIVATE" || !module_.publishedVersion) notFound();

  const isOwner = module_.ownerId === user.id;
  if (!isOwner) {
    const acquisition = await prisma.acquisition.findUnique({
      where: { userId_moduleId: { userId: user.id, moduleId } },
    });
    if (!acquisition) notFound();
  }

  const graph = moduleGraphSchema.parse(module_.publishedVersion.graph);
  const inputs = graph.nodes
    .filter((n) => n.data.kind === "input")
    .map((n) => ({
      nodeId: n.id,
      variableName: n.data.kind === "input" ? n.data.variableName : "",
      question: n.data.kind === "input" ? n.data.question : "",
      defaultValue: n.data.kind === "input" ? n.data.defaultValue : "",
    }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{module_.title}</h1>
      <p className="mt-1 text-sm text-muted">{module_.description}</p>
      <div className="mt-8">
        <RunForm moduleId={module_.id} inputs={inputs} />
      </div>
    </div>
  );
}
