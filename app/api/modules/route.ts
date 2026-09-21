import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { emptyGraph } from "@/types/graph";
import { SEED_TEMPLATES } from "@/lib/templates/seedTemplates";

const createSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(2000).default(""),
  category: z.string().max(60).default("General"),
  templateKey: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const modules = await prisma.module.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(modules);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const template = parsed.data.templateKey
    ? SEED_TEMPLATES.find((t) => t.key === parsed.data.templateKey)
    : undefined;

  const title = template ? template.title : (parsed.data.title || "Untitled module");

  const module_ = await prisma.module.create({
    data: {
      ownerId: session.user.id,
      title,
      slug: slugify(title),
      description: template ? template.description : parsed.data.description,
      category: template ? template.category : parsed.data.category,
      draftGraph: template ? template.graph : emptyGraph(),
    },
  });

  return NextResponse.json(module_);
}
