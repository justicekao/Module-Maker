import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema } from "@/types/graph";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(60).optional(),
  priceCents: z.number().int().min(0).max(1_000_000).optional(),
  graph: moduleGraphSchema.optional(),
});

export async function GET(_request: Request, props: RouteContext<"/api/modules/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const module_ = await prisma.module.findUnique({ where: { id } });
  if (!module_ || module_.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(module_);
}

export async function PATCH(request: Request, props: RouteContext<"/api/modules/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const module_ = await prisma.module.findUnique({ where: { id } });
  if (!module_ || module_.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { graph, ...rest } = parsed.data;
  const updated = await prisma.module.update({
    where: { id },
    data: {
      ...rest,
      ...(graph ? { draftGraph: graph } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, props: RouteContext<"/api/modules/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const module_ = await prisma.module.findUnique({ where: { id } });
  if (!module_ || module_.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
