import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, props: RouteContext<"/api/modules/[id]/acquire">) {
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
  if (module_.priceCents > 0) {
    return NextResponse.json(
      { error: "This module is paid — use checkout instead." },
      { status: 400 },
    );
  }

  const acquisition = await prisma.acquisition.upsert({
    where: { userId_moduleId: { userId: session.user.id, moduleId: id } },
    update: {},
    create: {
      userId: session.user.id,
      moduleId: id,
      moduleVersionId: module_.publishedVersion.id,
    },
  });

  return NextResponse.json(acquisition);
}
