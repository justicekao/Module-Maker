import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema } from "@/types/graph";
import { FlowEditor } from "@/components/builder/flow-editor";

export default async function BuilderPage(props: PageProps<"/builder/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const module_ = await prisma.module.findUnique({ where: { id } });
  if (!module_ || module_.ownerId !== user.id) notFound();

  const graph = moduleGraphSchema.parse(module_.draftGraph);

  return (
    <FlowEditor
      meta={{
        id: module_.id,
        title: module_.title,
        description: module_.description,
        category: module_.category,
        priceCents: module_.priceCents,
        visibility: module_.visibility,
      }}
      graph={graph}
    />
  );
}
