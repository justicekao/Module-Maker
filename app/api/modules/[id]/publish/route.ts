import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema, validateGraph } from "@/types/graph";

const publishSchema = z.object({
  visibility: z.enum(["UNLISTED", "PUBLISHED"]).default("PUBLISHED"),
  priceCents: z.number().int().min(0).max(1_000_000).default(0),
  changelog: z.string().max(500).optional(),
});

export async function POST(request: Request, props: RouteContext<"/api/modules/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const module_ = await prisma.module.findUnique({ where: { id } });
  if (!module_ || module_.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const graph = moduleGraphSchema.parse(module_.draftGraph);
  const errors = validateGraph(graph);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Graph is not valid.", details: errors }, { status: 400 });
  }

  const latest = await prisma.moduleVersion.findFirst({
    where: { moduleId: id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const version = await prisma.moduleVersion.create({
    data: {
      moduleId: id,
      version: nextVersion,
      graph,
      changelog: parsed.data.changelog,
    },
  });

  const updated = await prisma.module.update({
    where: { id },
    data: {
      publishedVersionId: version.id,
      visibility: parsed.data.visibility,
      priceCents: parsed.data.priceCents,
    },
  });

  return NextResponse.json(updated);
}
