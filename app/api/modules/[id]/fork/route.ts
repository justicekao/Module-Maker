import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function POST(_request: Request, props: RouteContext<"/api/modules/[id]/fork">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const module_ = await prisma.module.findUnique({
    where: { id },
    include: { publishedVersion: true },
  });
  if (!module_ || module_.visibility === "PRIVATE" || !module_.publishedVersion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = module_.ownerId === session.user.id;
  if (!isOwner && module_.priceCents > 0) {
    const acquisition = await prisma.acquisition.findUnique({
      where: { userId_moduleId: { userId: session.user.id, moduleId: id } },
    });
    if (!acquisition) {
      return NextResponse.json(
        { error: "You need to acquire this module before you can fork it." },
        { status: 403 },
      );
    }
  }

  const fork = await prisma.module.create({
    data: {
      ownerId: session.user.id,
      title: `Copy of ${module_.title}`,
      slug: slugify(`copy of ${module_.title}`),
      description: module_.description,
      category: module_.category,
      forkedFromId: module_.id,
      draftGraph: module_.publishedVersion.graph as object,
    },
  });

  return NextResponse.json(fork);
}
