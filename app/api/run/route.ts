import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moduleGraphSchema } from "@/types/graph";
import { executeGraph } from "@/lib/engine/executeGraph";
import { makeApiKeyResolver, MissingApiKeyError } from "@/lib/apiKeys";

const runSchema = z.object({
  moduleId: z.string().min(1),
  inputs: z.record(z.string(), z.string()).default({}),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const module_ = await prisma.module.findUnique({
    where: { id: parsed.data.moduleId },
    include: { publishedVersion: true },
  });
  if (!module_ || module_.visibility === "PRIVATE" || !module_.publishedVersion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = module_.ownerId === session.user.id;
  if (!isOwner) {
    const acquisition = await prisma.acquisition.findUnique({
      where: { userId_moduleId: { userId: session.user.id, moduleId: module_.id } },
    });
    if (!acquisition) {
      return NextResponse.json(
        { error: "You need to get this module before running it." },
        { status: 403 },
      );
    }
  }

  const graph = moduleGraphSchema.parse(module_.publishedVersion.graph);

  const run = await prisma.run.create({
    data: {
      userId: session.user.id,
      moduleId: module_.id,
      moduleVersionId: module_.publishedVersion.id,
      status: "RUNNING",
    },
  });

  const getApiKey = makeApiKeyResolver(session.user.id);

  try {
    const result = await executeGraph({
      graph,
      initialInputs: parsed.data.inputs,
      getApiKey,
      onStep: async (step) => {
        await prisma.runStep.create({
          data: {
            runId: run.id,
            nodeId: step.nodeId,
            nodeLabel: step.nodeLabel,
            provider: step.provider,
            model: step.model,
            prompt: step.prompt,
            output: step.output,
            status: step.status,
            errorMessage: step.errorMessage,
            completedAt: new Date(),
          },
        });
      },
    });

    const completedRun = await prisma.run.update({
      where: { id: run.id },
      data: { status: "COMPLETED", completedAt: new Date() },
      include: { steps: true },
    });

    return NextResponse.json({ run: completedRun, finalOutput: result.finalOutput });
  } catch (error) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date() },
    });

    const message =
      error instanceof MissingApiKeyError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The module failed to run.";

    const runWithSteps = await prisma.run.findUnique({
      where: { id: run.id },
      include: { steps: true },
    });

    return NextResponse.json({ error: message, run: runWithSteps }, { status: 422 });
  }
}
